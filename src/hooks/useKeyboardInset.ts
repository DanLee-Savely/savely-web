import { useEffect, useState } from "react";

// 화면 키보드가 가린 아래쪽 높이(px)와 보이는 영역 높이. iOS Safari는 키보드가 열려도 fixed 기준(레이아웃 뷰포트)을 줄이지 않아서
// 바닥에 붙은 시트가 키보드 뒤로 숨는다. visualViewport로 보이는 영역을 재서 시트를 그만큼 올린다
export function useKeyboardInset() {
  const [view, setView] = useState({ inset: 0, height: 0 });

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setView({ inset: Math.max(0, window.innerHeight - vv.height - vv.offsetTop), height: vv.height });
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return view;
}
