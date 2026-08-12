# 수업 자료실 콘텐츠 이미지

`docs/[비상교육] 테마 특강_N.*_활동지.pdf` 6종을 페이지별 이미지로 변환한 결과물입니다.
원본이 960×540(16:9)이라 카드 썸네일(`aspect-[16/9]`)과 슬라이드에 그대로 맞습니다.

| 폴더 | 원본 PDF | 페이지 |
|---|---|---|
| `theme-1/` | 1. 언제나 처음은 낯설다 | 1 |
| `theme-2/` | 2. 시간이 돈이라면 | 3 |
| `theme-3/` | 3. 이해해야 즐긴다 | 1 |
| `theme-4/` | 4. 많이 알수록 깊어진다 | 3 |
| `theme-5/` | 5. 배워서 남 줘라 | 2 |
| `theme-6/` | 6. 행복한 공부 | 4 |

- `pN.jpg` — 슬라이드용, 폭 1400px
- `thumb.jpg` — 카드 썸네일용, 1페이지, 폭 480px
- JPEG q82 / 전체 1.4MB

연결 지점은 `src/features/resources/mock-data.ts` 의 `LESSON_DECKS`(contentId → 페이지 배열)와
각 콘텐츠의 `thumb` 필드입니다.

## 재생성

PDF가 바뀌면 아래로 다시 뽑습니다. (`pip install pymupdf pillow` 필요)

```python
import glob, os, re, pymupdf

SRC, OUT = r'docs', r'prototype/public/lesson'
SLIDE_W, THUMB_W, Q = 1400, 480, 82

for f in sorted(glob.glob(os.path.join(SRC, '*테마 특강*.pdf')),
                key=lambda f: int(re.search(r'특강_(\d+)', f).group(1))):
    n = int(re.search(r'특강_(\d+)', f).group(1))
    d = os.path.join(OUT, f'theme-{n}')
    os.makedirs(d, exist_ok=True)
    doc = pymupdf.open(f)
    for i, page in enumerate(doc):
        for w, name in [(SLIDE_W, f'p{i+1}.jpg')] + ([(THUMB_W, 'thumb.jpg')] if i == 0 else []):
            s = w / page.rect.width
            page.get_pixmap(matrix=pymupdf.Matrix(s, s)).pil_save(
                os.path.join(d, name), format='JPEG', quality=Q, optimize=True)
```
