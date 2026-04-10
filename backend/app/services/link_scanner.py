import base64
import httpx
from app.core.config import settings

VT_BASE = "https://www.virustotal.com/api/v3"


def _url_id(url: str) -> str:
    """VirusTotal identifies URLs by their base64url-encoded form (no padding)."""
    return base64.urlsafe_b64encode(url.encode()).rstrip(b"=").decode()


def _parse_result(data: dict) -> dict:
    attrs = data["data"]["attributes"]

    # analyses/{id} uses "stats", urls/{id} uses "last_analysis_stats"
    stats = attrs.get("last_analysis_stats") or attrs.get("stats", {})

    malicious  = stats.get("malicious", 0)
    suspicious = stats.get("suspicious", 0)
    harmless   = stats.get("harmless", 0)
    undetected = stats.get("undetected", 0)
    total      = malicious + suspicious + harmless + undetected or 1

    if malicious >= 5:
        risk = "dangerous"
    elif malicious >= 2 or suspicious >= 5:
        risk = "suspicious"
    else:
        risk = "safe"

    score = round(malicious / total, 2)

    # engines that flagged it
    results = attrs.get("last_analysis_results") or attrs.get("results", {})
    matched_feeds = [
        engine for engine, r in results.items()
        if r.get("category") in ("malicious", "suspicious")
    ][:10]

    threat_types = list({
        r.get("result")
        for r in results.values()
        if r.get("category") in ("malicious", "suspicious") and r.get("result")
    })[:5]

    return {
        "risk": risk,
        "score": score,
        "details": {
            "matched_feeds": matched_feeds,
            "threat_types": threat_types,
            "redirects_to": attrs.get("last_final_url"),
        },
    }


async def scan_link(url: str) -> dict:
    headers = {"x-apikey": settings.virustotal_api_key}

    async with httpx.AsyncClient(timeout=15) as client:
        # Try cached report first — avoids consuming a submission quota call
        resp = await client.get(f"{VT_BASE}/urls/{_url_id(url)}", headers=headers)

        if resp.status_code == 404:
            # URL not in VT yet — submit it for analysis
            submit = await client.post(
                f"{VT_BASE}/urls",
                headers=headers,
                data={"url": url},
            )
            submit.raise_for_status()
            analysis_id = submit.json()["data"]["id"]

            # Fetch the analysis result
            resp = await client.get(
                f"{VT_BASE}/analyses/{analysis_id}", headers=headers
            )

        resp.raise_for_status()
        return _parse_result(resp.json())
