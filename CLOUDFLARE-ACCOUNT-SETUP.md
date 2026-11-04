# 치유숲씨 사이트 문의 기능 설정

사이트 파일은 `site/`, 문의 API는 저장소 루트의 `functions/`에 있습니다. 문의는 Resend를 통해 운영자 메일로 전달하고, D1에는 스팸 제한용 해시 값만 저장합니다. 회원가입·로그인·비밀번호 저장 기능은 포함하지 않습니다.

## 1. Cloudflare Pages 빌드 설정

Cloudflare 대시보드에서 Workers & Pages → 사이트 프로젝트 → Settings → Builds & deployments로 이동합니다.

- Root directory: 비워 두거나 저장소 루트(`/`)
- Build command: `exit 0`
- Build output directory: `site`
- Git integration: 이 저장소의 `main` 브랜치

Pages Functions는 프로젝트 루트의 `/functions`에서 읽으므로 Root directory를 `site`로 바꾸지 마세요.

## 2. 문의 제한용 D1 연결

1. Cloudflare 대시보드 → Storage & databases → D1 SQL Database에서 `chiyusup-contact` 데이터베이스를 만듭니다.
2. 데이터베이스 Console에서 `migrations/0001_contact_rate_limits.sql`을 실행합니다.
3. Pages 프로젝트 → Settings → Bindings → Add → D1 database에서 이 DB를 선택합니다.
4. Variable name을 `DB`로 지정하고 저장합니다.

문의 본문이나 이메일 주소는 D1에 저장하지 않습니다. IP 주소 대신 해시된 제한 키를 저장하고, 마지막 요청 후 24시간이 지난 기록은 다음 문의 때 정리합니다.

## 3. 문의 메일 설정

Resend에서 본인 소유의 발신 도메인(예: `mail.내도메인`)을 추가하고 인증하세요. Resend가 안내하는 메일용 DNS 레코드만 등록하고 기존 웹사이트 연결용 `CNAME`은 그대로 두세요. 인증된 발신 주소와 발송 전용 API 키를 준비합니다.

Pages 프로젝트 → Settings → Variables and Secrets → Production에 아래 값을 추가합니다.

| 이름 | 종류 | 값 |
|---|---|---|
| `SITE_URL` | Variable | 현재 운영 사이트 주소. 예: `https://www.xn--om2b15fvyfwod99ae5b7qz45b.xn--h32bi4v.xn--3e0b707e` |
| `CONTACT_EMAIL` | Variable | 문의를 받을 운영자 이메일 주소 |
| `MAIL_FROM` | Variable | Resend에서 인증한 발신자. 예: `치유숲씨 <hello@mail.내도메인>` |
| `RESEND_API_KEY` | Secret | Resend 발송 전용 API 키 |
| `CONTACT_RATE_LIMIT_SECRET` | Secret | 요청 제한용 임의 비밀값 (32바이트 이상 권장) |

두 Secret은 GitHub 파일이나 채팅에 올리지 말고 Cloudflare Secret에만 입력하세요. `CONTACT_RATE_LIMIT_SECRET`은 PowerShell에서 아래처럼 만들 수 있습니다.

```powershell
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$bytes = New-Object byte[] 32
$rng.GetBytes($bytes)
[Convert]::ToBase64String($bytes)
$rng.Dispose()
```

출력된 값을 `CONTACT_RATE_LIMIT_SECRET`에 넣으세요. `SITE_URL`은 운영 주소와 정확히 같아야 문의 API의 출처 검사가 통과합니다. 이전에 전달한 주소와 현재 도메인 표기가 다를 수 있으니 Cloudflare의 실제 도메인 화면에서 확인하세요.

Resend는 소유한 발신 도메인을 인증한 뒤 이메일을 보낼 수 있습니다. [Resend 발신 도메인 안내](https://resend.com/docs/dashboard/domains/introduction)

## 4. 적용

D1 binding과 다섯 변수를 저장한 뒤 Pages에서 새 배포를 실행하세요. 사이트 문의 양식은 이름, 답변 받을 이메일, 문의 종류, 내용을 운영자 이메일로 보냅니다. 방문자 계정은 만들지 않습니다.

문의 메일 전송에 실패하면 양식에 재시도 안내가 표시됩니다. 페이지에는 Discord 커뮤니티와 GitHub 오류 제보 링크도 남아 있습니다.

이전에 회원 인증용 D1 테이블을 만들었다면 이 업데이트는 해당 테이블을 사용하지 않으며 자동 삭제도 하지 않습니다. 과거 계정 데이터가 있다면 필요 여부를 확인한 뒤 Cloudflare D1에서 별도로 삭제하세요.
