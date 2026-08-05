# LUNARA Landing Page

라이프스타일 콘텐츠 스튜디오 테마 원페이지 랜딩. 브랜드명은 영문(LUNARA), 본문 콘텐츠는 한글로 작성.

## 레퍼런스 취득 경로

Figma MCP로 `get_design_context`(node `81:2182`, 1920 viewport)를 조회했으나 응답이 100k+ 문자로
잘려 전체 코드를 한 번에 받지 못했습니다. 서브에이전트를 통해 `get_metadata` + 섹션별
`get_design_context` + `get_screenshot`을 실행해 실측 x/y/width/height 기반 픽셀 좌표를 확보하고,
스크린샷(2040×6888 원본)으로 비주얼 톤·구성 순서를 교차 확인했습니다.

## 그리드 (요청에 따라 가장 신경 쓴 부분)

전부 1920 viewport, 120px 페이지 마진(콘텐츠 폭 1680) 기준 실측.

| 섹션 | split | 실측 근거 |
|---|---|---|
| Hero | 단일 중앙 컬럼(~8/12) | 이미지 블록 x=115, width=920 (센터 컬럼 1150 대비 inset) |
| Featured (3카드) | 4-4-4 | 정적 3열, 캐러셀 트랙/진행률 tick 인디케이터는 제외 |
| Philosophy + Quote | 9-3 | 본문 x=0 width=1113.3(1520 대비 8.8/12), 인용 x=1173.3 width=546.7(4.3/12) → 9-3으로 반올림 |
| History 헤딩 | 8-4 | 헤딩 x=0 width=1060(1520 대비 8.4/12), 플레이스홀더 x=1060 width=460(3.6/12) → 8-4로 반올림 |
| History 연도 | 4-4-4 | 원본은 6패널 가로 스크롤이나, 스크린샷 실제 노출은 2026/2025/2024 3열 정적 그리드로 단순화 |
| Portfolio bento | row1 3-3-6 / row2 3-3-3-3 | x=120/545/970(폭 405/405/830), x=120/545/970/1395(폭 405×4) — 리터럴 그대로 구현 |
| Contact | 중앙 6/12 폼, 내부 6-6 라벨 페어 | 폼 컨테이너 x=480 width=960(1680 대비 5.7/12), 라벨 각 480px(정확히 6-6) |
| Footer | flex row | 원본도 12컬럼 split이 아닌 자연폭 flex 행 (business/address/phone/instagram) |

## 원본 대비 제외한 요소 ("페이지 이동으로 보이는 모든 요소는 빼줘" 지시에 따름)

1. **최상단 nav bar** (Artists / Productions / Contact 앵커 링크) — 페이지 내비게이션이라 전체 제외.
2. **Featured 섹션 스크롤 진행률 tick 인디케이터**(27개 눈금) — 페이지네이션 점과 동일한 역할이라 제외,
   정적 3카드 그리드로 대체.
3. **AslanX 섹션의 "01 / 05" 스텝 카운터 + 5카드 슬라이더** — 멀티스텝 캐러셀 페이지네이션이라 제외,
   정적 단일 인용구 카드로 축약.

치트시트의 "캐러셀·페이지네이션·화살표 버튼 금지" 하드 룰과도 방향이 일치해 전 섹션을 스크롤/슬라이더
없는 정적 그리드로 구현했습니다.

## 디자인 토큰 준수

- `css/styles.css`는 원본 디자인 킷 그대로 두고 수정하지 않았습니다 (EDITORIAL 프리셋, 본문 20px).
- 원본이 다크 모노톤(`#1d1d1d` 배경, 흰 텍스트)이라 `css/site.css`에 `--brand-bg`, `--brand-border`,
  `--brand-line`, `--brand-text-subtle` 4개의 `--brand-*` 커스텀 프로퍼티만 추가했습니다 — 레퍼런스가
  실측으로 제공한 값이므로 "임의 HEX 금지" 규칙의 예외로 취급했습니다.
- 폰트 크기는 실측값(히어로 워드마크 ~100px, 섹션 헤딩 ~90px, 카드 타이틀 22px, 메타 17px, 폼 라벨
  16px)을 가장 가까운 기존 타입 스케일 토큰에 매핑했습니다: 히어로 → `--fs-display-lg`(102),
  섹션 헤딩 → `--fs-display-sm`(80), 카드 타이틀 → `--fs-body-1`(20, bold), 메타/라벨 →
  `--fs-body-2`(18). 자간·행간·폰트 크기 모두 `var(--token)`만 사용, 임의 px/em 없음.
- Border-radius는 실측 그대로 전 구간 `--radius-0`(sharp corner).
- 이미지 영역은 전부 `.img`(= `#d9d9d9`, `--color-placeholder`)로 채웠습니다 (사용자 지시 사항).

## 스택

- `index.html` — 시맨틱 마크업, Variant Memo + Layout Declaration 주석 포함
- `css/styles.css` — 공유 디자인 킷 (불변)
- `css/site.css` — LUNARA 브랜드 컴포넌트
- `js/main.js` — 스크롤 reveal (캐러셀 없음)
- `.github/workflows/deploy.yml` — GitHub Pages 배포 (Actions)
