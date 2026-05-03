"use client";

import { useEffect, useState } from "react";

export function ClientIdField() {
  const [cid, setCid] = useState<string>("");
  useEffect(() => {
    try {
      const v = localStorage.getItem("cc_cid");
      if (v) setCid(v);
    } catch {}
  }, []);
  if (!cid) return null;
  return <input type="hidden" name="cc_cid" value={cid} readOnly />;
}
