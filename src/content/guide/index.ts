import { GuideArticle } from "@/domain/guide/GuideArticle";
import { GuideCatalog } from "@/domain/guide/GuideCatalog";
import gagyebuHabit from "./gagyebu-habit.md";

// 가이드 글 원고 등록부 (91-content §4-2). 새 글은 이 폴더에 <slug>.md를 두고 아래 목록에 한 줄을 더한다.
// 폴더의 원고가 빠짐없이 등록됐는지, 파일 이름과 slug가 같은지는 guides.test.ts가 확인한다.
// 원고 형식이 틀리면 여기서 오류가 나 빌드가 멈춘다
export const guideSources: Record<string, string> = {
  "gagyebu-habit": gagyebuHabit,
};

export const guideCatalog = new GuideCatalog(Object.values(guideSources).map((source) => GuideArticle.parse(source)));
