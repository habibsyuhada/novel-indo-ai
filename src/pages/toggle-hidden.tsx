import { useEffect, useRef } from "react";
import { useRouter } from "next/router";

export default function ToggleHidden() {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const current = window.localStorage.getItem("isHidden");
    const next = current === "1" ? "0" : "1";
    window.localStorage.setItem("isHidden", next);

    router.replace("/");
  }, [router]);

  return null;
}
