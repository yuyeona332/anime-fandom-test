/**
 * Mission library seed — 100 entries across 4 levels (25 each).
 *
 * Tone rules (PLAN.md):
 *   - Optional-feeling, never imperative. End with "할까요?" / "어때요?"
 *     or with "안 해도 괜찮아요" implied.
 *   - Specific, not abstract. "5분 산책" beats "운동".
 *   - Time-bounded. <=15분 by design.
 *   - Bad:  "오늘 30분 산책하세요."
 *   - Good: "5분 정도 동네 한 바퀴 걸어볼까요? 안 해도 괜찮아요."
 *
 * After MVP shown to first user, replace any entry that gets a "이건
 * 부담돼" reaction. Keep ids stable so existing mission_logs rows still
 * resolve.
 */

import type { MissionTemplate } from "./types";

export const missionSeed: ReadonlyArray<MissionTemplate> = [
  // ── L1 인지 (집 안, 가장 작은 행동) ────────────────────────────────────
  { id: "L1-window-open", level: "L1_cognitive", category: "window", prompt: "창문 5분만 열어둘까요? 환기만 해도 충분합니다.", expectedMinutes: 5 },
  { id: "L1-sunlight", level: "L1_cognitive", category: "sunlight", prompt: "햇볕 5분만 쬐어볼까요? 베란다든 창가든.", expectedMinutes: 5 },
  { id: "L1-water-glass", level: "L1_cognitive", category: "hydrate", prompt: "물 한 잔 천천히 마셔볼까요? 한 모금씩.", expectedMinutes: 2 },
  { id: "L1-warm-tea", level: "L1_cognitive", category: "drink", prompt: "따뜻한 차 한 잔 어때요? 좋아하는 거 한 종류면 돼요.", expectedMinutes: 5 },
  { id: "L1-deep-breath", level: "L1_cognitive", category: "breath", prompt: "깊게 숨 한 번. 천천히 들이마시고 천천히 내쉬기. 3번.", expectedMinutes: 1 },
  { id: "L1-music-one-song", level: "L1_cognitive", category: "music", prompt: "좋아하는 노래 한 곡 들어볼까요? 가사 따라불러도 좋아요.", expectedMinutes: 4 },
  { id: "L1-mirror-hello", level: "L1_cognitive", category: "mirror", prompt: "손 한 번 씻고 거울 잠깐 보기. 인상 안 써도 괜찮아요.", expectedMinutes: 2 },
  { id: "L1-sit-up", level: "L1_cognitive", category: "posture", prompt: "침대에서 잠시 일어나 앉아볼까요? 그게 다예요.", expectedMinutes: 2 },
  { id: "L1-desk-one-spot", level: "L1_cognitive", category: "tidy-cog", prompt: "책상 위 한 곳만 정리. 손이 닿는 만큼만.", expectedMinutes: 5 },
  { id: "L1-look-photo", level: "L1_cognitive", category: "media", prompt: "좋아하는 그림이나 사진 한 장 다시 봐볼까요?", expectedMinutes: 3 },
  { id: "L1-smell-favorite", level: "L1_cognitive", category: "scent", prompt: "좋아하는 향 한 번 맡아보기. 커피든 향초든 빨래든.", expectedMinutes: 2 },
  { id: "L1-podcast-5min", level: "L1_cognitive", category: "audio", prompt: "라디오나 팟캐스트 5분만 틀어둘까요? 안 들어도 BGM이라도.", expectedMinutes: 5 },
  { id: "L1-stretch-arms", level: "L1_cognitive", category: "stretch", prompt: "팔 위로 한 번 쭉. 그게 다예요.", expectedMinutes: 1 },
  { id: "L1-brush-slow", level: "L1_cognitive", category: "hygiene", prompt: "양치 한 번 천천히 해볼까요? 평소보다 살짝 길게.", expectedMinutes: 3 },
  { id: "L1-phone-down", level: "L1_cognitive", category: "rest", prompt: "핸드폰 잠시 내려놓고 3분만 가만히. 음악은 들어도 돼요.", expectedMinutes: 3 },
  { id: "L1-touch-soft", level: "L1_cognitive", category: "tactile", prompt: "좋아하는 이불이나 옷 한 번 만져보기. 그 느낌 잠깐.", expectedMinutes: 2 },
  { id: "L1-sky-1min", level: "L1_cognitive", category: "outside-look", prompt: "창밖 하늘 1분만 보기. 구름이 있어도 없어도.", expectedMinutes: 1 },
  { id: "L1-favorite-lyric", level: "L1_cognitive", category: "music", prompt: "좋아하는 곡 가사 한 줄 따라부르기. 속으로도 괜찮아요.", expectedMinutes: 3 },
  { id: "L1-warm-water-face", level: "L1_cognitive", category: "hygiene", prompt: "따뜻한 물로 얼굴 한 번 씻기. 잠깐이면 충분해요.", expectedMinutes: 3 },
  { id: "L1-book-one-page", level: "L1_cognitive", category: "read", prompt: "좋아하는 책 한 페이지만 읽어볼까요? 한 줄도 OK.", expectedMinutes: 5 },
  { id: "L1-plant-water", level: "L1_cognitive", category: "plant", prompt: "키우는 식물 있으면 물 한 번 줄까요? 없으면 패스.", expectedMinutes: 2 },
  { id: "L1-eyes-closed-1min", level: "L1_cognitive", category: "rest", prompt: "눈 감고 1분 쉬어보기. 자도 괜찮아요.", expectedMinutes: 1 },
  { id: "L1-clip-favorite", level: "L1_cognitive", category: "media", prompt: "좋아하는 영상 1분만 보기. 짧은 거 하나.", expectedMinutes: 2 },
  { id: "L1-old-photo", level: "L1_cognitive", category: "media", prompt: "갤러리에서 좋아하는 사진 한 장 다시 보기.", expectedMinutes: 2 },
  { id: "L1-warm-shower-feet", level: "L1_cognitive", category: "hygiene", prompt: "따뜻한 물로 발만 한 번 헹구기. 그것만으로도.", expectedMinutes: 3 },

  // ── L2 집안 행동 (집 안, 신체적) ───────────────────────────────────────
  { id: "L2-tidy-5min", level: "L2_home_action", category: "tidy", prompt: "5분 정리. 한 곳만, 침대 위든 책상 위든.", expectedMinutes: 5 },
  { id: "L2-cook-one-meal", level: "L2_home_action", category: "cook", prompt: "한 끼 직접 만들어볼까요? 라면도 좋아요.", expectedMinutes: 15 },
  { id: "L2-bed-make", level: "L2_home_action", category: "bed", prompt: "침구 한 번 정리. 이불만 펴도 돼요.", expectedMinutes: 3 },
  { id: "L2-stretch-1min", level: "L2_home_action", category: "stretch", prompt: "1분 스트레칭. 좋아하는 부위만.", expectedMinutes: 2 },
  { id: "L2-shower-5min", level: "L2_home_action", category: "shower", prompt: "따뜻한 물로 5분 샤워. 머리 안 감아도 돼요.", expectedMinutes: 8 },
  { id: "L2-fold-one-thing", level: "L2_home_action", category: "laundry", prompt: "빨래 한 가지만 개기. 양말 한 켤레도 충분.", expectedMinutes: 3 },
  { id: "L2-dish-one", level: "L2_home_action", category: "dishes", prompt: "설거지 한 그릇만. 컵 하나라도 좋아요.", expectedMinutes: 3 },
  { id: "L2-plant-wipe", level: "L2_home_action", category: "plant", prompt: "식물 잎 한 번 닦아주기. 손가락으로 살짝.", expectedMinutes: 3 },
  { id: "L2-book-shelf", level: "L2_home_action", category: "tidy", prompt: "책 한 권 꺼내서 다른 자리에 놓기. 그게 다예요.", expectedMinutes: 2 },
  { id: "L2-shoe-wipe", level: "L2_home_action", category: "shoes", prompt: "신발 한 켤레 휴지로 한 번 닦기.", expectedMinutes: 3 },
  { id: "L2-trash-empty", level: "L2_home_action", category: "trash", prompt: "휴지통 한 번 비우기. 작은 거 하나라도.", expectedMinutes: 2 },
  { id: "L2-mirror-clean", level: "L2_home_action", category: "clean", prompt: "거울 한 번 닦기. 휴지로 한 번 쓱.", expectedMinutes: 2 },
  { id: "L2-desk-5things", level: "L2_home_action", category: "tidy", prompt: "책상 위 물건 5개만 제자리에. 5개만요.", expectedMinutes: 5 },
  { id: "L2-warm-meal", level: "L2_home_action", category: "cook", prompt: "따뜻한 음식 한 그릇 어때요? 죽, 미역국, 라면 다 좋아요.", expectedMinutes: 10 },
  { id: "L2-fruit-piece", level: "L2_home_action", category: "eat", prompt: "과일 한 조각 먹기. 자르기 귀찮으면 바나나도 OK.", expectedMinutes: 3 },
  { id: "L2-closet-pull", level: "L2_home_action", category: "closet", prompt: "옷장에서 안 입는 옷 1벌 빼두기. 버리든 두든 상관없어요.", expectedMinutes: 5 },
  { id: "L2-chair-wipe", level: "L2_home_action", category: "clean", prompt: "책상 의자 한 번 휴지로 닦기.", expectedMinutes: 2 },
  { id: "L2-room-1min-sweep", level: "L2_home_action", category: "clean", prompt: "방 바닥 1분만 쓸어보기. 한 곳만요.", expectedMinutes: 3 },
  { id: "L2-make-drink", level: "L2_home_action", category: "drink", prompt: "따뜻한 음료 직접 만들기. 커피, 차, 코코아 뭐든.", expectedMinutes: 5 },
  { id: "L2-photos-5", level: "L2_home_action", category: "digital", prompt: "핸드폰 사진 5장만 정리. 마음에 안 드는 거 5장 지우기.", expectedMinutes: 5 },
  { id: "L2-table-meal", level: "L2_home_action", category: "eat", prompt: "식탁이나 책상에서 한 끼 먹기. 누워서 말고.", expectedMinutes: 15 },
  { id: "L2-nail-trim", level: "L2_home_action", category: "grooming", prompt: "손톱 한 번 짧게 다듬기. 한 손만 해도 OK.", expectedMinutes: 5 },
  { id: "L2-hair-comb", level: "L2_home_action", category: "grooming", prompt: "머리 한 번 빗어볼까요? 그것만으로도.", expectedMinutes: 2 },
  { id: "L2-change-clothes", level: "L2_home_action", category: "clothes", prompt: "새 옷으로 한 가지만 갈아입기. 양말이라도.", expectedMinutes: 5 },
  { id: "L2-wash-face", level: "L2_home_action", category: "hygiene", prompt: "세수 한 번. 거품 안 써도 돼요.", expectedMinutes: 3 },

  // ── L3 집 밖 행동 (집 밖, 짧은 외출) ───────────────────────────────────
  { id: "L3-walk-5min", level: "L3_outside_action", category: "walk", prompt: "5분만 동네 걷기. 신발 신고 나가는 것만 해도 성공.", expectedMinutes: 5 },
  { id: "L3-corner-store", level: "L3_outside_action", category: "errand", prompt: "동네 가게 한 번 다녀올까요? 살 게 없어도 괜찮아요.", expectedMinutes: 10 },
  { id: "L3-mailbox", level: "L3_outside_action", category: "errand", prompt: "우편함이나 택배함 한 번 확인하기.", expectedMinutes: 5 },
  { id: "L3-park-loop", level: "L3_outside_action", category: "walk", prompt: "동네 공원 한 바퀴. 한 바퀴면 충분합니다.", expectedMinutes: 10 },
  { id: "L3-cvs-drink", level: "L3_outside_action", category: "errand", prompt: "편의점에서 음료 하나 사기. 좋아하는 거 골라요.", expectedMinutes: 10 },
  { id: "L3-cafe-takeout", level: "L3_outside_action", category: "cafe", prompt: "동네 카페에서 음료 한 잔 테이크아웃 어때요?", expectedMinutes: 15 },
  { id: "L3-balcony-5min", level: "L3_outside_action", category: "outside", prompt: "베란다나 옥상에 5분 나가 있기.", expectedMinutes: 5 },
  { id: "L3-bakery", level: "L3_outside_action", category: "errand", prompt: "동네 빵집 한 번 들러볼까요? 빵 하나 골라봐도 좋아요.", expectedMinutes: 10 },
  { id: "L3-one-block", level: "L3_outside_action", category: "walk", prompt: "동네 한 블록만 걷기. 한 모퉁이 돌아오면 끝.", expectedMinutes: 5 },
  { id: "L3-recycling", level: "L3_outside_action", category: "errand", prompt: "분리수거 한 번. 작은 거 하나라도 들고 나가요.", expectedMinutes: 5 },
  { id: "L3-pharmacy", level: "L3_outside_action", category: "errand", prompt: "약국에서 작은 거 하나 사기. 마스크나 밴드 한 통.", expectedMinutes: 10 },
  { id: "L3-fruit-shop", level: "L3_outside_action", category: "errand", prompt: "동네 슈퍼에서 과일 한 봉지 사보기.", expectedMinutes: 15 },
  { id: "L3-library-pass", level: "L3_outside_action", category: "library", prompt: "동네 도서관 한 번 들르기. 책 안 빌려도 OK.", expectedMinutes: 15 },
  { id: "L3-park-bench", level: "L3_outside_action", category: "sit-out", prompt: "동네 공원 벤치에 5분만 앉아 있기.", expectedMinutes: 10 },
  { id: "L3-dog-watch", level: "L3_outside_action", category: "walk", prompt: "동물병원이나 강아지 산책로 한 번 지나가기. 보기만.", expectedMinutes: 10 },
  { id: "L3-store-small-thing", level: "L3_outside_action", category: "errand", prompt: "동네 가게에서 작은 거 하나. 사탕 한 봉지도 OK.", expectedMinutes: 10 },
  { id: "L3-trail-entrance", level: "L3_outside_action", category: "walk", prompt: "산책로 입구까지만 걸어가보기. 입구만 보고 와도 돼요.", expectedMinutes: 10 },
  { id: "L3-cafe-in-store", level: "L3_outside_action", category: "cafe", prompt: "동네 카페에서 매장 음료 한 잔. 5분 앉아 있다 오기.", expectedMinutes: 15 },
  { id: "L3-post-office", level: "L3_outside_action", category: "errand", prompt: "가까운 우체국 한 번 들러보기. 안 부쳐도 OK.", expectedMinutes: 15 },
  { id: "L3-flower-shop", level: "L3_outside_action", category: "walk", prompt: "동네 꽃집 앞 잠시 멈춰서 한 번 보기.", expectedMinutes: 5 },
  { id: "L3-gym-pass", level: "L3_outside_action", category: "walk", prompt: "헬스장이나 필라테스 앞 한 번 지나가보기. 안 들어가도.", expectedMinutes: 10 },
  { id: "L3-atm", level: "L3_outside_action", category: "errand", prompt: "가까운 ATM 한 번 다녀오기.", expectedMinutes: 10 },
  { id: "L3-snack", level: "L3_outside_action", category: "errand", prompt: "동네 슈퍼에서 좋아하는 간식 한 봉지 사기.", expectedMinutes: 10 },
  { id: "L3-block-loop", level: "L3_outside_action", category: "walk", prompt: "동네 한 바퀴 걷고 집에 들어오기. 한 바퀴만.", expectedMinutes: 15 },
  { id: "L3-market-entrance", level: "L3_outside_action", category: "walk", prompt: "동네 시장 입구까지만 가보기. 입구만 보고 와도 좋아요.", expectedMinutes: 10 },

  // ── L4 사회적 행동 (사회적 접촉) ───────────────────────────────────────
  { id: "L4-cafe-hello", level: "L4_social_action", category: "cafe", prompt: "카페에서 직원에게 \"안녕하세요\" 한 마디. 그게 다예요.", expectedMinutes: 10 },
  { id: "L4-friend-msg", level: "L4_social_action", category: "friend", prompt: "친구 한 명에게 짧은 메시지 1개. \"잘 지내?\" 한 줄.", expectedMinutes: 2 },
  { id: "L4-family-text", level: "L4_social_action", category: "family", prompt: "가족 한 명에게 안부 문자 한 줄.", expectedMinutes: 3 },
  { id: "L4-thanks-store", level: "L4_social_action", category: "store", prompt: "동네 가게 나오면서 \"감사합니다\" 한 마디.", expectedMinutes: 5 },
  { id: "L4-sns-comment", level: "L4_social_action", category: "sns", prompt: "좋아하는 사람 SNS에 짧은 댓글 1개. 이모지만이라도.", expectedMinutes: 3 },
  { id: "L4-friend-like", level: "L4_social_action", category: "sns", prompt: "친구 글에 좋아요 한 번 누르기. 그것만으로도 메시지가 가요.", expectedMinutes: 1 },
  { id: "L4-old-friend", level: "L4_social_action", category: "friend", prompt: "오랜만에 연락 안 한 친구에게 \"잘 지내지?\" 한 줄.", expectedMinutes: 3 },
  { id: "L4-family-meal-ask", level: "L4_social_action", category: "family", prompt: "가족에게 \"오늘 뭐 먹어?\" 한 마디.", expectedMinutes: 2 },
  { id: "L4-song-recommend", level: "L4_social_action", category: "friend", prompt: "친구에게 좋아하는 노래 한 곡 추천하기. 링크 한 줄 보내면 끝.", expectedMinutes: 3 },
  { id: "L4-cafe-ask", level: "L4_social_action", category: "cafe", prompt: "카페에서 \"오늘 뭐가 맛있어요?\" 직원에게 한 번 물어보기.", expectedMinutes: 10 },
  { id: "L4-call-1min", level: "L4_social_action", category: "friend", prompt: "가까운 친구에게 1분만 통화. \"잠깐 통화 가능?\" 보내고 시작.", expectedMinutes: 5 },
  { id: "L4-family-meal", level: "L4_social_action", category: "family", prompt: "가족과 한 끼 같이 먹기. 짧아도 OK.", expectedMinutes: 15 },
  { id: "L4-share-photo", level: "L4_social_action", category: "friend", prompt: "친구에게 좋아하는 사진 한 장 보내기. 설명 없어도 돼요.", expectedMinutes: 2 },
  { id: "L4-group-hello", level: "L4_social_action", category: "chat", prompt: "단톡방에 짧은 인사 한 마디. \"다들 잘 지내?\" 한 줄.", expectedMinutes: 3 },
  { id: "L4-shop-owner", level: "L4_social_action", category: "store", prompt: "자주 가는 가게 사장님에게 한 마디. \"맛있게 잘 먹었어요\".", expectedMinutes: 5 },
  { id: "L4-sns-post", level: "L4_social_action", category: "sns", prompt: "SNS에 짧은 글 한 줄. 사진 없어도 한 문장이면 됩니다.", expectedMinutes: 5 },
  { id: "L4-share-video", level: "L4_social_action", category: "friend", prompt: "친구에게 안 본 영상 한 개 공유. 짧은 거 하나.", expectedMinutes: 3 },
  { id: "L4-honest-family", level: "L4_social_action", category: "family", prompt: "가족에게 \"오늘 좀 힘들었어\" 한마디. 어렵지만 한 번.", expectedMinutes: 5 },
  { id: "L4-store-chat", level: "L4_social_action", category: "store", prompt: "가게 직원과 짧은 대화 한 마디. 날씨 얘기도 OK.", expectedMinutes: 5 },
  { id: "L4-meet-suggest", level: "L4_social_action", category: "friend", prompt: "친구에게 \"우리 한번 볼래?\" 한 번 제안.", expectedMinutes: 3 },
  { id: "L4-thanks-msg", level: "L4_social_action", category: "friend", prompt: "가까운 사람에게 고마운 거 한 줄. 짧을수록 좋아요.", expectedMinutes: 3 },
  { id: "L4-friend-how", level: "L4_social_action", category: "friend", prompt: "친구에게 \"요즘 뭐 해?\" 한 번 묻기.", expectedMinutes: 2 },
  { id: "L4-shop-praise", level: "L4_social_action", category: "store", prompt: "좋아하는 카페·가게 사장님께 칭찬 한 마디.", expectedMinutes: 5 },
  { id: "L4-video-5min", level: "L4_social_action", category: "friend", prompt: "친구와 5분 영상통화. \"얼굴만 보고 끊자\"고 시작해도 OK.", expectedMinutes: 5 },
  { id: "L4-family-chat", level: "L4_social_action", category: "family", prompt: "가족과 5분 짧은 대화. 날씨든 점심 메뉴든.", expectedMinutes: 5 },
];
