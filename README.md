# CHZZK + YouTube Chat Overlay

<p align="center">
  <strong>두 플랫폼의 라이브 채팅을 하나의 투명 오버레이로.</strong><br />
  Windows 10 / 11 · 개인 방송용 데스크톱 채팅 오버레이
</p>

<p align="center">
  <a href="https://github.com/alleyhos/Chzzk_Youtube_Overlay/releases">다운로드 및 업데이트</a>
  ·
  <a href="https://github.com/alleyhos/Chzzk_Youtube_Overlay/issues">오류 제보</a>
</p>

---

## ✨ 주요 기능

- **통합 채팅:** 치지직과 YouTube 라이브 채팅을 한 창에 표시합니다.
- **투명 오버레이:** 게임 화면 위에 배치하고 상단 영역을 드래그해 위치를 조정할 수 있습니다.
- **플랫폼별 연결:** 두 플랫폼 중 필요한 채팅만 선택해서 연결할 수 있습니다.
- **자동 재연결:** 치지직 방송이 아직 시작되지 않았다면 대기하고, 방송이 시작되면 연결을 다시 시도합니다.
- **설정 기억:** 방송 주소와 화면 설정을 PC에 저장해 다음 실행 때 불러옵니다.
- **전역 단축키:** 오버레이 표시와 게임 클릭 통과 기능을 빠르게 전환합니다.

## ⬇️ 다운로드 및 실행

1. [Releases 페이지](https://github.com/alleyhos/Chzzk_Youtube_Overlay/releases)에서 최신 Windows 파일을 받습니다.
2. 다운로드한 `Chzzk_Youtube_Overlay.exe`를 실행합니다.
3. 설정 창에서 연결할 플랫폼의 주소를 입력하고 연결 버튼을 누릅니다.

> 별도의 .NET 설치 없이 실행할 수 있도록 배포되는 버전을 기준으로 안내합니다.

## 🔗 채팅 연결

### 치지직

1. 설정 창의 **치지직 채팅** 입력란에 채널 또는 라이브 주소를 붙여넣습니다.
   - 예: `https://chzzk.naver.com/live/채널ID`
2. **치지직 연결**을 누릅니다.
3. 방송이 꺼져 있으면 채널을 확인하며 대기하고, 방송이 시작되면 연결을 시도합니다.

### YouTube

1. 설정 창의 **YouTube 라이브 채팅** 입력란에 방송 주소 또는 채팅 팝아웃 주소를 붙여넣습니다.
2. **YouTube 채팅 연결**을 누릅니다.
3. 필요하면 **설정 저장**을 눌러 다음 실행에도 주소를 사용합니다.

입력할 수 있는 주소 형식:

| 형식 | 예시 |
|---|---|
| 동영상 주소 | `https://www.youtube.com/watch?v=동영상ID` |
| 라이브 주소 | `https://www.youtube.com/live/동영상ID` |
| 채팅 팝아웃 | `https://www.youtube.com/live_chat?v=동영상ID&is_popout=1` |
| 동영상 ID | 11자리 동영상 ID |

YouTube는 방송마다 주소가 달라지므로 새 방송을 시작할 때 주소를 업데이트해야 합니다.

## 🎮 오버레이 조작

| 단축키 | 기능 |
|---|---|
| `Ctrl + Alt + O` | 오버레이 숨김 / 표시 |
| `Ctrl + Alt + P` | 게임 클릭 통과 켜기 / 끄기 |

- 오버레이 위쪽 영역을 드래그해 위치를 옮길 수 있습니다.
- 게임은 **창 모드** 또는 **테두리 없는 창 모드**를 권장합니다.
- 독점 전체 화면에서는 게임이 오버레이를 덮을 수 있습니다.
- OBS 게임 캡처에서는 별도 오버레이 창이 제외될 수 있습니다. 디스플레이 캡처를 사용하면 오버레이가 방송 화면에 포함될 수 있습니다.

## 🔒 데이터 및 개인정보

- 방송 주소와 화면 설정은 이 PC의 `%LOCALAPPDATA%\ChzzkOverlay\settings.json`에 저장됩니다.
- 채팅 연결은 이 PC에서 각 플랫폼에 직접 이루어지며, 별도 중계 서버를 사용하지 않습니다.
- README에 기재된 앱 동작 기준으로 로그인 토큰이나 앱 Secret을 저장하거나 요청하지 않습니다.

## ⚠️ 알려진 제한 및 유의사항

- 치지직 연결은 공개 채팅 웹 연결을 이용하는 **비공식 방식**입니다.
- YouTube 연결도 공개 웹 채팅 인터페이스를 이용하며, 공식 YouTube Data API 연동은 아닙니다.
- 각 플랫폼의 웹 페이지 구조, 내부 형식 또는 접속 정책이 변경되면 연결이 일시적으로 실패할 수 있습니다.
- 이 프로젝트는 치지직 또는 YouTube의 공식 앱이 아닙니다.

## 📄 라이선스 및 크레딧

포함된 Agash-YTLiveChat 관련 라이선스 고지는 [LICENSES/Agash-YTLiveChat-MIT.txt](LICENSES/Agash-YTLiveChat-MIT.txt)를 확인해 주세요. 원문 저작권 및 MIT 라이선스 문구는 변경하지 않고 함께 제공합니다.

---

<p align="center">
  Made by <strong>alleyhos2_17607 (소방호스)</strong>
</p>
