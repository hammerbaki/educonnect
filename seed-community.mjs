import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);

// First, create dummy users for sample posts
const dummyUsers = [
  { openId: "dummy_user_1", name: "수능레전드", email: "legend@test.com" },
  { openId: "dummy_user_2", name: "서울대가자", email: "snu@test.com" },
  { openId: "dummy_user_3", name: "의대지망생", email: "med@test.com" },
  { openId: "dummy_user_4", name: "바나나우유얌", email: "banana@test.com" },
  { openId: "dummy_user_5", name: "공부괴물", email: "study@test.com" },
  { openId: "dummy_user_6", name: "수학포기자", email: "mathgiveup@test.com" },
  { openId: "dummy_user_7", name: "국어의신", email: "korean@test.com" },
  { openId: "dummy_user_8", name: "잠실동허수", email: "jamsil@test.com" },
  { openId: "dummy_user_9", name: "4수해볼까", email: "retry@test.com" },
  { openId: "dummy_user_10", name: "새벽4시기상", email: "dawn@test.com" },
  { openId: "dummy_user_11", name: "모의고사킬러", email: "killer@test.com" },
  { openId: "dummy_user_12", name: "내신1등급", email: "grade1@test.com" },
  { openId: "dummy_user_13", name: "카페인중독자", email: "caffeine@test.com" },
  { openId: "dummy_user_14", name: "독서실단골", email: "library@test.com" },
  { openId: "dummy_user_15", name: "컴공가고싶다", email: "cs@test.com" },
  { openId: "dummy_user_16", name: "생기부장인", email: "record@test.com" },
  { openId: "dummy_user_17", name: "면접연습중", email: "interview@test.com" },
  { openId: "dummy_user_18", name: "수시올인", email: "susi@test.com" },
  { openId: "dummy_user_19", name: "정시러", email: "jungsi@test.com" },
  { openId: "dummy_user_20", name: "야자탈출러", email: "escape@test.com" },
];

const userIds = [];
for (const user of dummyUsers) {
  try {
    const [result] = await connection.execute(
      `INSERT INTO users (openId, name, email, role) VALUES (?, ?, ?, 'user') ON DUPLICATE KEY UPDATE name=VALUES(name)`,
      [user.openId, user.name, user.email]
    );
    if (result.insertId) {
      userIds.push(result.insertId);
    } else {
      const [rows] = await connection.execute(`SELECT id FROM users WHERE openId = ?`, [user.openId]);
      userIds.push(rows[0].id);
    }
  } catch (e) {
    const [rows] = await connection.execute(`SELECT id FROM users WHERE openId = ?`, [user.openId]);
    if (rows.length > 0) userIds.push(rows[0].id);
  }
}

console.log(`Created/found ${userIds.length} users`);

// Sample posts
const posts = [
  // 입시정보
  {
    userId: 0, authorName: "수능레전드", category: "입시정보",
    title: "2027 수시 주요 변경사항 총정리",
    content: "안녕하세요 여러분! 2027학년도 수시 변경사항 정리해봤습니다.\n\n1. 학생부교과전형 확대\n- 서울 주요대 교과전형 선발 비율 증가\n- 수능 최저 완화 추세\n\n2. 학생부종합전형\n- 자기소개서 폐지 이후 학생부 기재 중요성 증가\n- 세특 기재 분량 제한 변경\n\n3. 논술전형\n- 일부 대학 논술전형 신설/확대\n\n궁금한 점 있으면 댓글 달아주세요!",
    tags: JSON.stringify(["수시", "입시변경", "2027"]), viewCount: 342, likeCount: 28, commentCount: 15
  },
  {
    userId: 1, authorName: "서울대가자", category: "입시정보",
    title: "6모 접수 방법 총정리 (현역/N수 다름!!)",
    content: "6모 접수 시즌이라 정리해봅니다\n\n현역: 학교에서 일괄 접수 (담임쌤한테 문의)\nN수생: 시도교육청 홈페이지에서 개별 접수\n\n접수 기간 놓치면 진짜 답 없으니까 꼭 확인하세요ㅠㅠ\n외부생은 온라인 접수 후 현장 방문 필요한 경우도 있으니 공지 잘 읽어보세요.\n\n준비물: 사진, 수험료, 신분증\n\n화이팅!!",
    tags: JSON.stringify(["6모", "모의고사", "접수"]), viewCount: 567, likeCount: 45, commentCount: 23
  },
  {
    userId: 2, authorName: "의대지망생", category: "입시정보",
    title: "의대 수시 vs 정시 어디가 유리할까?",
    content: "의대 지망하는 고3입니다.\n\n내신 1.2인데 수능은 항상 1~2등급 왔다갔다 하거든요.\n수시로 넣을지 정시에 올인할지 고민이에요.\n\n선배님들 의견 부탁드립니다...\n\n참고로 생기부는 나름 열심히 채웠고, 면접은 자신 있는 편입니다.\n사탐은 생윤/사문이고 과탐으로 바꿀까도 고민 중...",
    tags: JSON.stringify(["의대", "수시", "정시"]), viewCount: 891, likeCount: 67, commentCount: 42
  },
  {
    userId: 10, authorName: "모의고사킬러", category: "입시정보",
    title: "주요대 수능 최저 기준 정리 (2027)",
    content: "주요대 수능 최저 정리해봤어요\n\n서울대: 없음 (일반전형)\n연세대: 국수영탐 중 2개 합 5 이내\n고려대: 국수영탐 중 2개 합 5 이내\n성균관대: 2개 합 6 이내\n한양대: 없음 (에리카는 있음)\n중앙대: 2개 합 6 이내\n\n*학과마다 다를 수 있으니 반드시 모집요강 확인하세요!\n\n최저 맞추는 게 수시의 핵심이니까 수능 공부도 병행하세요 ㅎㅎ",
    tags: JSON.stringify(["수능최저", "주요대", "2027"]), viewCount: 1203, likeCount: 89, commentCount: 31
  },
  {
    userId: 17, authorName: "수시올인", category: "입시정보",
    title: "학종 서류 평가 이렇게 봅니다 (입학사정관 특강 정리)",
    content: "오늘 학교에서 입학사정관 초청 특강 들었는데 핵심 정리해봄\n\n1. 학업역량: 성적 추이 + 세특 내용의 깊이\n2. 진로역량: 지원 학과와의 연관성 (이게 제일 중요!!)\n3. 공동체역량: 리더십보다는 '협업' 경험\n\n사정관님이 강조한 것: \"양보다 질\"\n활동 개수가 많은 것보다 하나를 깊게 파고든 학생이 좋은 평가를 받는다고 하심\n\n그리고 세특에서 교과 연계 탐구가 가장 중요하다고 하셨어요",
    tags: JSON.stringify(["학종", "서류평가", "입학사정관"]), viewCount: 456, likeCount: 52, commentCount: 18
  },

  // 학습질문
  {
    userId: 5, authorName: "수학포기자", category: "학습질문",
    title: "수학 개념 다 까먹었는데 어떡하죠...",
    content: "아니 5개월 쉬었다고 수학 개념 디테일을 다 까먹었네요 하......\n\n미적분 극한부터 다시 해야 하나요?\n아니면 기출 풀면서 모르는 개념만 잡아도 될까요?\n\n시간이 없어서 개념서 처음부터 다시 하기엔 좀 그렇고...\n\n현재 상태: 3모 수학 4등급\n목표: 수능 2등급\n\n가능한 건가요ㅠㅠ 현실적인 조언 부탁드려요",
    tags: JSON.stringify(["수학", "개념", "공부법"]), viewCount: 234, likeCount: 12, commentCount: 19
  },
  {
    userId: 6, authorName: "국어의신", category: "학습질문",
    title: "비문학 지문 읽는 속도가 너무 느려요",
    content: "국어 비문학 풀 때 지문 하나 읽는데 5분 넘게 걸리는데 정상인가요?\n\n특히 과학/기술 지문이면 두 번 세 번 읽어야 이해가 되고...\n시간 안에 다 못 풀어서 항상 찍는 문제가 3-4개씩 있어요\n\n지문 읽는 속도 올리는 방법 있을까요?\n아니면 그냥 많이 풀면 되나요?\n\n참고로 3모 국어 3등급이었습니다",
    tags: JSON.stringify(["국어", "비문학", "독해"]), viewCount: 178, likeCount: 8, commentCount: 14
  },
  {
    userId: 3, authorName: "바나나우유얌", category: "학습질문",
    title: "영어 내신은 1등급인데 모의고사는 3등급ㅋㅋ",
    content: "ㅋㅋㅋㅋ 웃기죠\n\n내신은 외우면 되니까 1등급 나오는데\n모의고사는 처음 보는 지문이라 그런지 멘붕 옴\n\n특히 빈칸추론이랑 순서배열이 진짜 안 됨...\n\n어떻게 해야 모의고사 영어도 올릴 수 있을까요?\nEBS 연계 말고 비연계 대비 어떻게 하시나요?",
    tags: JSON.stringify(["영어", "모의고사", "내신"]), viewCount: 312, likeCount: 21, commentCount: 16
  },
  {
    userId: 7, authorName: "잠실동허수", category: "학습질문",
    title: "수학 노베 인서울 현실적으로 가능?",
    content: "현실적으로 5월부터 시작하는 노베가 인서울 가능할까요?\n\n작수 기준 국어4 수학은 다 찍어서 8등급 영어3 탐구 44\n\n수학을 아예 처음부터 해야 하는데...\n개념부터 시작하면 수능까지 시간이 될까요?\n\n목표는 인서울 어디든 좋으니까 갈 수 있는 데 가고 싶습니다\n\n현실적인 조언 부탁드립니다 ㅠ",
    tags: JSON.stringify(["수학", "노베이스", "인서울"]), viewCount: 445, likeCount: 33, commentCount: 27
  },
  {
    userId: 4, authorName: "공부괴물", category: "학습질문",
    title: "확통 vs 미적분 어떤 게 유리한가요?",
    content: "현재 확통 선택인데 미적분으로 바꿀까 고민 중입니다\n\n확통 장점: 쉬움, 만점 가능\n확통 단점: 표준점수 불리\n\n미적분 장점: 표준점수 유리, 이과 대부분 미적\n미적분 단점: 어려움, 시간 부족할 수 있음\n\n현재 수학 3등급인데 미적으로 바꿔도 될까요?\n아니면 확통으로 만점 노리는 게 나을까요?",
    tags: JSON.stringify(["확통", "미적분", "선택과목"]), viewCount: 523, likeCount: 38, commentCount: 31
  },
  {
    userId: 12, authorName: "카페인중독자", category: "학습질문",
    title: "하루 공부 시간표 좀 봐주세요",
    content: "고3 현역인데 하루 시간표 짜봤는데 현실적인지 봐주세요\n\n06:00 기상\n06:30-07:30 국어 기출\n08:00-12:00 학교 수업\n13:00-15:00 수학 개념/문풀\n15:00-17:00 영어 독해\n17:00-18:00 저녁\n18:00-20:00 탐구 (생윤/사문)\n20:00-22:00 수학 N제\n22:00-23:00 오답정리\n23:30 취침\n\n이거 현실적으로 가능한 건가요?\n아니면 수정할 부분 있으면 알려주세요ㅠ",
    tags: JSON.stringify(["시간표", "공부법", "고3"]), viewCount: 678, likeCount: 45, commentCount: 22
  },
  {
    userId: 13, authorName: "독서실단골", category: "학습질문",
    title: "N제 언제 시작하는 게 맞나요?",
    content: "현역이라 잘 모르는데 N제 시작 시기가 궁금합니다\n\n지금 개념 + 기출 하고 있는데\n주변에서 벌써 N제 풀고 있다고 하니까 조급해지네요...\n\n개념이 완벽하지 않은 상태에서 N제 들어가도 되나요?\n아니면 기출 다 끝내고 시작해야 하나요?\n\n수학 기준으로 현재 3모 85점이었습니다",
    tags: JSON.stringify(["N제", "수학", "공부순서"]), viewCount: 289, likeCount: 15, commentCount: 20
  },

  // 전공탐색
  {
    userId: 14, authorName: "컴공가고싶다", category: "전공탐색",
    title: "컴퓨터공학 vs 소프트웨어학 차이가 뭔가요?",
    content: "컴퓨터공학이랑 소프트웨어학이 비슷해 보이는데 뭐가 다른 건가요?\n\n코딩에 관심 있어서 이쪽으로 가고 싶은데\n학교마다 이름이 달라서 헷갈려요\n\n컴퓨터공학: 하드웨어 + 소프트웨어?\n소프트웨어학: 소프트웨어만?\n\n취업할 때 차이가 있나요?\n그리고 AI 쪽으로 가려면 어떤 학과가 더 좋을까요?",
    tags: JSON.stringify(["컴퓨터공학", "소프트웨어", "전공선택"]), viewCount: 567, likeCount: 34, commentCount: 25
  },
  {
    userId: 2, authorName: "의대지망생", category: "전공탐색",
    title: "의대 말고 의료 관련 학과 뭐가 있나요?",
    content: "의대가 1지망이긴 한데 현실적으로 어려울 수 있어서\n플랜B를 생각하고 있습니다\n\n의료 관련 학과 중에서 취업 잘 되고\n보람 있는 학과 추천해주세요\n\n간호학, 약학, 물리치료학, 방사선학, 임상병리학...\n이런 것들 중에 뭐가 좋을까요?\n\n성적은 내신 1.5 / 모의고사 1~2등급입니다",
    tags: JSON.stringify(["의료", "간호학", "약학"]), viewCount: 723, likeCount: 41, commentCount: 33
  },
  {
    userId: 15, authorName: "생기부장인", category: "전공탐색",
    title: "심리학과 가고 싶은데 문과도 가능한가요?",
    content: "심리학에 관심이 많은데 저는 문과거든요\n\n심리학과가 이과에서만 가는 건 아니죠?\n문과에서 심리학과 가면 불리한 점이 있나요?\n\n그리고 심리학과 졸업하면 뭘 할 수 있는지도 궁금해요\n상담사 말고 다른 진로도 있나요?\n\nUX 리서처라는 직업이 있다고 들었는데 심리학이랑 관련 있나요?",
    tags: JSON.stringify(["심리학", "문과", "진로"]), viewCount: 345, likeCount: 22, commentCount: 18
  },
  {
    userId: 9, authorName: "새벽4시기상", category: "전공탐색",
    title: "경영학과 vs 경제학과 뭐가 다른 거임?",
    content: "둘 다 비슷해 보이는데 뭐가 다른 건지 모르겠음\n\n경영학: 회사 운영?\n경제학: 경제 이론?\n\n취업할 때 어떤 게 더 유리한가요?\n그리고 복수전공으로 둘 다 하는 사람도 있나요?\n\n아 그리고 경영학과 가면 회계사 될 수 있나요?\n경제학과에서도 가능한가요?",
    tags: JSON.stringify(["경영학", "경제학", "전공비교"]), viewCount: 412, likeCount: 27, commentCount: 21
  },
  {
    userId: 19, authorName: "야자탈출러", category: "전공탐색",
    title: "건축학과 5년제인 거 알고 계셨나요?",
    content: "건축학과 알아보다가 깜놀한 게\n건축학과는 5년제라는 거...\n\n건축학(5년) vs 건축공학(4년) 차이점:\n- 건축학: 설계 중심, 건축사 자격증\n- 건축공학: 시공/구조 중심, 기술사\n\n5년 다니는 거 부담되긴 하는데\n건축 설계를 하고 싶으면 5년제를 가야 한다고 하더라고요\n\n건축 관련 학과 재학생분 계시면 현실 좀 알려주세요ㅠ",
    tags: JSON.stringify(["건축학", "5년제", "건축공학"]), viewCount: 298, likeCount: 19, commentCount: 14
  },

  // 자유게시판
  {
    userId: 8, authorName: "4수해볼까", category: "자유게시판",
    title: "공부하다가 갑자기 현타 올 때 어떡함?",
    content: "공부 많이 안 해도 그냥 이 짓 자체가 현타가 씨게 옴\n\n\"내가 왜 이걸 하고 있지?\"\n\"이게 다 무슨 의미가 있지?\"\n\n이런 생각 드는 날 어떻게 극복하시나요?\n\n그냥 쉬면 되나요 아니면 억지로라도 해야 하나요?\n\n요즘 슬럼프인 것 같은데 빠져나올 수가 없네요...",
    tags: JSON.stringify(["현타", "슬럼프", "멘탈"]), viewCount: 892, likeCount: 78, commentCount: 45
  },
  {
    userId: 19, authorName: "야자탈출러", category: "자유게시판",
    title: "야자 빠지고 싶은데 방법 있나요ㅋㅋ",
    content: "야자가 너무 비효율적인 것 같아서요\n\n학교에서 하면 집중이 안 되고\n집에서 하면 더 효율적인데\n\n근데 담임쌤이 야자 빠지면 안 된다고 하시고...\n\n야자 면제 받은 분들 어떻게 하셨나요?\n부모님 동의서 쓰면 되나요?\n\n아 그리고 야자 대신 독서실 가는 것도 가능한가요?",
    tags: JSON.stringify(["야자", "자습", "학교"]), viewCount: 456, likeCount: 34, commentCount: 28
  },
  {
    userId: 9, authorName: "새벽4시기상", category: "자유게시판",
    title: "오늘의 공부 인증!! 12시간 달성",
    content: "오늘 드디어 순공 12시간 달성했습니다!!\n\n06:00 기상\n06:30-08:00 국어 기출 (1.5h)\n08:30-12:00 학교 (3.5h)\n13:00-18:00 수학 (5h)\n19:00-22:00 탐구 (3h)\n\n수학이랑 사탐만 주구장창하기도 했고...\n조금 이른 시간에 끝낸 감이 없잖아 있지만\n그래도 뿌듯하네요\n\n내일도 화이팅!!",
    tags: JSON.stringify(["공부인증", "순공", "동기부여"]), viewCount: 567, likeCount: 56, commentCount: 19
  },
  {
    userId: 12, authorName: "카페인중독자", category: "자유게시판",
    title: "수능 D-200 넘겼는데 아직 아무것도 안 함",
    content: "ㅎㅎ...\n\n진짜 아무것도 안 했는데 D-200이 넘어갔네요\n\n지금부터라도 하면 되겠죠...?\n\n아직 늦지 않았다고 해주세요 제발ㅠㅠ\n\n현재 상태:\n국어 4등급\n수학 5등급\n영어 3등급\n탐구 44\n\n인서울 가능할까요?",
    tags: JSON.stringify(["D-200", "동기부여", "시작"]), viewCount: 1023, likeCount: 89, commentCount: 52
  },
  {
    userId: 3, authorName: "바나나우유얌", category: "자유게시판",
    title: "관리형 독서실 비용 얼만가요?",
    content: "6모 끝나고 반수반 느낌으로 관리형 독서실 갈려고 하는데\n수업 안 듣고 밥이랑 부가 비용만 내면 얼마 정도 하나요?\n\n서울 기준으로 알려주시면 감사하겠습니다\n\n그리고 관리형 독서실 다녀본 분들 후기도 궁금해요\n효과 있었나요?",
    tags: JSON.stringify(["독서실", "관리형", "비용"]), viewCount: 234, likeCount: 11, commentCount: 15
  },
  {
    userId: 18, authorName: "정시러", category: "자유게시판",
    title: "패드 추천 좀 해주세요",
    content: "공부용 패드 사려는데 뭐가 좋을까요?\n\n아이패드 에어 vs 갤럭시탭 S9\n\n주로 인강 듣고 PDF 필기할 건데\n어떤 게 더 좋나요?\n\n예산은 100만원 이하로 생각하고 있습니다\n\n아 그리고 애플펜슬 vs S펜 어떤 게 필기감 좋나요?",
    tags: JSON.stringify(["패드", "태블릿", "공부용품"]), viewCount: 345, likeCount: 18, commentCount: 24
  },

  // 합격수기
  {
    userId: 0, authorName: "수능레전드", category: "합격수기",
    title: "[합격수기] 내신 3등급에서 연세대 합격한 후기",
    content: "안녕하세요, 작년에 연세대 경영학과에 합격한 선배입니다.\n\n내신 3.2였는데 정시로 합격했어요.\n\n수능 성적:\n국어 1등급 / 수학 1등급 / 영어 1등급 / 탐구 11\n\n공부법:\n1. 국어: EBS 연계 교재 3회독 + 기출 분석\n2. 수학: 개념 → 기출 → N제 순서로\n3. 영어: 매일 지문 5개씩 독해\n4. 탐구: 개념서 2회독 + 기출 3회독\n\n가장 중요한 건 꾸준함이었습니다.\n매일 같은 시간에 같은 양을 했어요.\n\n궁금한 거 있으면 댓글 달아주세요!",
    tags: JSON.stringify(["합격수기", "연세대", "정시"]), viewCount: 2341, likeCount: 156, commentCount: 67
  },
  {
    userId: 11, authorName: "내신1등급", category: "합격수기",
    title: "[합격수기] 학종으로 고려대 간 비결",
    content: "고려대 미디어학부 학종 합격생입니다!\n\n내신: 1.8\n비교과: 동아리(방송부) + 봉사활동\n\n제가 생각하는 합격 비결:\n\n1. 세특이 진짜 중요합니다\n- 모든 과목에서 미디어/커뮤니케이션 관련 탐구를 했어요\n- 국어: 미디어 리터러시 관련 보고서\n- 사회: SNS가 여론 형성에 미치는 영향 분석\n- 영어: 해외 미디어 산업 비교 분석\n\n2. 일관성이 핵심\n- 1학년부터 3학년까지 미디어 관련 활동을 꾸준히 했어요\n\n3. 면접 준비\n- 생기부 기반 예상 질문 50개 만들어서 연습했습니다\n\n화이팅하세요!!",
    tags: JSON.stringify(["합격수기", "고려대", "학종"]), viewCount: 1876, likeCount: 134, commentCount: 54
  },
  {
    userId: 16, authorName: "면접연습중", category: "합격수기",
    title: "[합격수기] 3등급에서 서울시립대 합격까지",
    content: "내신 3등급 초반이었는데 서울시립대 행정학과에 합격했습니다!\n\n솔직히 주변에서 많이 말렸어요\n\"그 성적으로 서울시립대는 무리야\"라고...\n\n근데 논술전형으로 도전했고 합격했습니다!\n\n논술 준비 방법:\n1. 6월부터 논술 학원 다님\n2. 매주 2편씩 논술 작성 연습\n3. 기출문제 분석이 제일 중요\n4. 시사 이슈 정리 노트 만들기\n\n논술전형은 내신이 좀 부족해도 도전할 수 있으니까\n포기하지 마세요!",
    tags: JSON.stringify(["합격수기", "서울시립대", "논술"]), viewCount: 987, likeCount: 78, commentCount: 35
  },
  {
    userId: 14, authorName: "컴공가고싶다", category: "합격수기",
    title: "[합격수기] 코딩 독학으로 성균관대 소프트웨어학과 합격",
    content: "성균관대 소프트웨어학과 SW특기자전형으로 합격했습니다!\n\n저는 코딩을 고1 때 독학으로 시작했어요\n\n준비 과정:\n1. 고1: 파이썬 기초 독학, 정보 올림피아드 도전\n2. 고2: 앱 개발 프로젝트 (학교 급식 알림 앱)\n3. 고3: 포트폴리오 정리 + 면접 준비\n\n면접에서 물어본 것:\n- 프로젝트 경험\n- 알고리즘 문제 해결 과정\n- 왜 소프트웨어를 하고 싶은지\n\n코딩에 관심 있는 분들 화이팅!!\n독학으로도 충분히 가능합니다",
    tags: JSON.stringify(["합격수기", "성균관대", "소프트웨어"]), viewCount: 1234, likeCount: 98, commentCount: 43
  },

  // 추가 학습질문
  {
    userId: 16, authorName: "면접연습중", category: "학습질문",
    title: "사탐만 해서 교과로 간호대 가능함?",
    content: "사탐 선택인데 교과전형으로 간호대 갈 수 있나요?\n\n내신 2등급 초반이고\n사탐은 생윤/사문 선택했습니다\n\n간호학과가 과탐 필수인 곳도 있다고 들었는데\n사탐으로 갈 수 있는 간호대가 어디어디 있나요?\n\n수능 최저도 사탐으로 맞출 수 있는 곳으로 알려주시면 감사하겠습니다",
    tags: JSON.stringify(["간호대", "사탐", "교과전형"]), viewCount: 267, likeCount: 14, commentCount: 11
  },
  {
    userId: 10, authorName: "모의고사킬러", category: "학습질문",
    title: "국어 노베도 7개월이면 수능 2-3등급 될까요?",
    content: "하하ㅏ ㅠ\n\n국어를 진짜 아무것도 안 했는데\n7개월 남았으면 2-3등급 가능할까요?\n\n현재 국어 5등급이고\n문학은 좀 되는데 비문학이 진짜 안 됩니다\n\n독서량도 거의 0이고...\n\n현실적인 플랜 좀 짜주세요ㅠㅠ",
    tags: JSON.stringify(["국어", "노베이스", "등급올리기"]), viewCount: 345, likeCount: 23, commentCount: 18
  },
  {
    userId: 5, authorName: "수학포기자", category: "학습질문",
    title: "시발점 스텝2 원래 어려운 거 맞음?",
    content: "시발점 미적분 했는데 워크북 스텝 2 너무 어렵따…\n\n내가 못해서 어려운 건지 원래 어려운 건지 모르겠음\n\n한 문제에 30분씩 걸리는데 정상인가요?\n\n아니면 스텝1 한 번 더 하고 올라가야 하나...\n\n수학 잘하시는 분들 조언 부탁드립니다",
    tags: JSON.stringify(["수학", "시발점", "문제집"]), viewCount: 198, likeCount: 9, commentCount: 13
  },
  {
    userId: 6, authorName: "국어의신", category: "학습질문",
    title: "지문을 이해하고 풀면 좋죠",
    content: "근데 ㅅㅂ 그걸 시험장에서 못한다는 게 문제죠\n\n그래서 시간이나 버릴 바엔 걍 눈풀로 푸는 게 나을 듯\n\n근데 이러면 3등급 이상은 못 올리겠죠?\n\n지문을 심층적으로 이해하려면 어떻게 해야 됨?\n\n약간 고1, 2모같이 쉬운 건 이해되는데\n수능급 지문은 진짜 뭔 소린지 모르겠음",
    tags: JSON.stringify(["국어", "독해", "시험전략"]), viewCount: 423, likeCount: 31, commentCount: 22
  },
];

// Insert posts with random time offsets
const now = new Date();
for (let i = 0; i < posts.length; i++) {
  const post = posts[i];
  const userId = userIds[post.userId] || userIds[0];
  // Spread posts over last 7 days
  const hoursAgo = Math.floor(Math.random() * 168);
  const createdAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

  try {
    await connection.execute(
      `INSERT INTO community_posts (userId, authorName, category, title, content, tags, viewCount, likeCount, commentCount, isPinned, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [userId, post.authorName, post.category, post.title, post.content, post.tags, post.viewCount, post.likeCount, post.commentCount, createdAt, createdAt]
    );
    console.log(`Created post: ${post.title}`);
  } catch (e) {
    console.error(`Failed to create post: ${post.title}`, e.message);
  }
}

// Add some sample comments
const sampleComments = [
  { postTitle: "2027 수시 주요 변경사항 총정리", comments: [
    { userId: 1, authorName: "서울대가자", content: "정리 감사합니다! 교과전형 확대가 제일 큰 변화인 것 같아요" },
    { userId: 4, authorName: "공부괴물", content: "자소서 폐지 이후 세특이 진짜 중요해졌죠..." },
    { userId: 9, authorName: "새벽4시기상", content: "논술전형 신설 대학 목록도 알려주실 수 있나요?" },
  ]},
  { postTitle: "수학 개념 다 까먹었는데 어떡하죠...", comments: [
    { userId: 0, authorName: "수능레전드", content: "기출 풀면서 모르는 개념 잡는 게 효율적이에요. 개념서 처음부터 다시 하면 시간 부족합니다" },
    { userId: 4, authorName: "공부괴물", content: "저도 비슷한 상황이었는데 수학의 정석 대신 개념원리로 빠르게 훑고 기출 들어갔어요" },
    { userId: 10, authorName: "모의고사킬러", content: "3모 4등급이면 충분히 2등급 가능해요! 화이팅!" },
  ]},
  { postTitle: "공부하다가 갑자기 현타 올 때 어떡함?", comments: [
    { userId: 1, authorName: "서울대가자", content: "저도 그런 날 있었어요. 그럴 땐 30분만 산책하고 오면 좀 나아져요" },
    { userId: 11, authorName: "내신1등급", content: "현타 올 때는 합격 후기 읽으면 동기부여 됩니다ㅋㅋ" },
    { userId: 12, authorName: "카페인중독자", content: "ㅇㅈ... 저도 요즘 매일 현타 옴 ㅠ" },
    { userId: 9, authorName: "새벽4시기상", content: "그냥 하루 쉬세요. 억지로 하면 더 힘들어져요" },
  ]},
  { postTitle: "컴퓨터공학 vs 소프트웨어학 차이가 뭔가요?", comments: [
    { userId: 0, authorName: "수능레전드", content: "컴공이 더 넓은 범위를 다루고, 소프트웨어학은 코딩에 더 집중하는 느낌이에요" },
    { userId: 9, authorName: "새벽4시기상", content: "취업할 때는 거의 차이 없다고 들었어요. 둘 다 개발자로 가는 건 같음" },
  ]},
  { postTitle: "[합격수기] 내신 3등급에서 연세대 합격한 후기", comments: [
    { userId: 5, authorName: "수학포기자", content: "와 진짜 대단하시네요... 수학 공부법 더 자세히 알려주실 수 있나요?" },
    { userId: 7, authorName: "잠실동허수", content: "정시의 힘... 내신 안 좋아도 수능만 잘 보면 되는 거군요" },
    { userId: 12, authorName: "카페인중독자", content: "매일 같은 양을 한다는 게 제일 어려운 것 같아요ㅠ" },
    { userId: 8, authorName: "4수해볼까", content: "꾸준함이 답이다... 명심하겠습니다" },
    { userId: 3, authorName: "바나나우유얌", content: "EBS 연계 3회독이면 시간 얼마나 걸렸나요?" },
  ]},
];

// Get post IDs by title
for (const sc of sampleComments) {
  const [rows] = await connection.execute(
    `SELECT id FROM community_posts WHERE title = ? LIMIT 1`,
    [sc.postTitle]
  );
  if (rows.length === 0) continue;
  const postId = rows[0].id;

  for (const comment of sc.comments) {
    const commentUserId = userIds[comment.userId] || userIds[0];
    const hoursAgo = Math.floor(Math.random() * 48);
    const createdAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

    try {
      await connection.execute(
        `INSERT INTO community_comments (postId, userId, authorName, content, likeCount, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [postId, commentUserId, comment.authorName, comment.content, Math.floor(Math.random() * 10), createdAt, createdAt]
      );
    } catch (e) {
      console.error(`Failed to create comment on "${sc.postTitle}":`, e.message);
    }
  }
}

console.log("\nSeed complete! Created sample posts and comments.");
await connection.end();
