# 치유숲씨 사이트와 계정 기능 설정

사이트 파일은 `site/`에 있고, 로그인 API는 저장소 루트의 `functions/`에 있습니다. Cloudflare Pages 프로젝트는 저장소 루트를 프로젝트 기준으로 잡아야 Functions를 함께 배포할 수 있습니다.

## 1. Cloudflare Pages 빌드 설정

Cloudflare 대시보드에서 Workers & Pages → 사이트 프로젝트 → Settings → Builds & deployments로 이동합니다.

- Root directory: 비워 두거나 저장소 루트(`/`)
- Build command: `exit 0`
- Build output directory: `site`
- Git integration: 이 GitHub 저장소의 `main` 브랜치

Cloudflare Pages Functions는 프로젝트 루트의 `functions/`에서 읽고, 정적 파일은 `site/`에서 제공합니다.

## 2. D1 데이터베이스 연결

1. Cloudflare 대시보드 → Storage & databases → D1 SQL Database → Create database에서 `chiyusup-members`를 만듭니다.
2. 데이터베이스 Console에 `migrations/0001_member_auth.sql`의 내용을 실행합니다.
3. Workers & Pages → 사이트 프로젝트 → Settings → Bindings → Add → D1 database에서 방금 만든 DB를 선택합니다.
4. Variable name을 정확히 `DB`로 지정하고 저장합니다.

Pages Functions가 D1을 사용하려면 프로젝트에 D1 binding을 추가해야 합니다. 설정을 저장한 뒤 새 배포를 실행하세요.

## 3. 인증 메일 설정

메일은 Resend API로 발송합니다. Resend에서 발신 도메인을 추가하고, 표시되는 DNS 레코드를 도메인의 DNS 관리 화면에 등록한 뒤 인증 완료 상태로 만듭니다. 사이트 도메인 레코드는 바꾸지 말고, Resend가 안내한 메일용 레코드만 추가하세요.

Resend에서 발송 전용 API 키를 만들고, Cloudflare Pages 프로젝트의 Settings → Variables and Secrets → Production에 아래 값을 설정합니다.

| 이름 | 종류 | 값 |
|---|---|---|
| `SITE_URL` | Variable | `https://www.xn--om2b15fvyfwod99ae5b7qz45b.xn--h32bi4v.xn--3e0b707e` (사용자가 알려준 사이트 주소. Cloudflare에 등록한 주소와 다르면 실제 주소로 교체) |
| `MAIL_FROM` | Variable | 인증된 발신자. 예: `치유숲씨 <account@mail.내도메인>` |
| `RESEND_API_KEY` | Secret | Resend 발송 전용 API 키 |

`RESEND_API_KEY`는 GitHub 파일이나 코드에 넣지 마세요. Cloudflare의 Secret 입력란에만 저장합니다. Preview 환경에서도 시험하려면 Preview에도 같은 종류의 binding과 변수를 따로 설정해야 합니다.

Resend는 소유한 발신 도메인을 추가하고 DNS 레코드 인증을 끝내야 가입자에게 메일을 보낼 수 있습니다. 메일 발송 전용 서브도메인(예: `mail.내도메인`)을 Resend에 추가하고, 안내된 메일용 DNS 레코드만 도메인 관리 화면에 등록하세요. 웹사이트 연결용 `CNAME`은 그대로 두세요. 도메인 인증이 끝나면 해당 서브도메인의 주소를 `MAIL_FROM`에 넣고 발송 전용 API 키를 만드세요.

## 4. 적용

D1 binding과 메일 변수를 모두 저장한 뒤 Cloudflare Pages에서 새 배포를 실행합니다. 가입한 사용자는 이메일 인증 링크를 눌러야 로그인할 수 있습니다. 로그인 창에서 비밀번호 재설정과 회원 탈퇴도 할 수 있습니다.

## 계정 API

- `POST /api/auth/register`: 가입 및 인증 메일 발송
- `POST /api/auth/login`: 로그인
- `GET /api/auth/session`: 로그인 상태 확인
- `POST /api/auth/logout`: 로그아웃
- `POST /api/auth/verify`: 이메일 인증 처리
- `POST /api/auth/resend-verification`: 인증 메일 재전송
- `POST /api/auth/forgot-password`: 재설정 메일 요청
- `POST /api/auth/reset-password`: 비밀번호 재설정
- `POST /api/auth/delete-account`: 재인증 후 계정 삭제

비밀번호는 PBKDF2-SHA256으로 해시하여 저장하고, 브라우저에는 HttpOnly·Secure·SameSite 쿠키로 세션을 유지합니다. 가입 이름과 이메일, 이메일 인증 상태, 보안 기록을 사용하며, 계정 데이터 안내는 `site/privacy.html`에 공개되어 있습니다.

## 무료 실행 한도 확인

Cloudflare Workers Free는 HTTP 요청 한 건의 CPU 실행 시간이 10ms로 제한됩니다. Cloudflare 문서도 인증처럼 계산량이 큰 요청은 10–20ms를 쓸 수 있다고 안내합니다. 이 구현은 비밀번호 보호에 PBKDF2-SHA256 310,000회를 사용하므로 무료 한도에서 가입·로그인이 `1102 Worker exceeded resource limits`로 실패할 수 있습니다. 배포 후 가입과 로그인을 확인하고, 오류가 나면 CPU 한도를 늘릴 수 있는 Workers 유료 플랜을 사용하거나 비밀번호 없는 이메일 링크 로그인으로 전환해야 합니다. 요금제 확인 전에는 로그인 기능이 실제로 동작한다고 안내하지 마세요.

Cloudflare 문서: [CPU 시간 제한](https://developers.cloudflare.com/workers/platform/limits/#cpu-time)
