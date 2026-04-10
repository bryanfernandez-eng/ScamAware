import { useState, useEffect } from "react";
import { api } from "../services/api";

export function useApi(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get(path)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [path]);

  return { data, loading, error };
}
