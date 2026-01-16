"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <button className="back-button" onClick={handleBack}>
      ← 뒤로 가기
    </button>
  );
}
