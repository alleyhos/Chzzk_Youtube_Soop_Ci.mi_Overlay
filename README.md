# CHZZK + YOUTUBE + SOOP Chat Overlay

<p align="center">
  <strong>치지직 · YouTube · SOOP 채팅을 하나의 투명 오버레이로.</strong><br />
  Windows 10 / 11 · 원컴 방송용 데스크톱 채팅 오버레이
</p>

<p align="center">
  <a href="https://github.com/alleyhos/Chzzk_Youtube_Overlay/releases">다운로드</a>
  ·
  <a href="https://github.com/alleyhos/Chzzk_Youtube_Overlay/issues">오류 제보</a>
</p>

---

## ✨ 주요 기능

- **3개 플랫폼 통합:** 치지직, YouTube, SOOP 채팅을 한 창에 표시합니다.
- **선택 연결:** 세 플랫폼 중 필요한 채팅만 연결할 수 있습니다.
- **투명 오버레이:** 게임 화면 위에 배치하고 상단 영역을 드래그해 위치를 조정합니다.
- **자동 재연결 및 대기:** 치지직은 방송 시작을 확인하며 연결을 재시도하고, SOOP는 방송이 꺼져 있으면 10초마다 다시 확인합니다.
- **설정 기억:** 입력한 채널·방송 주소와 화면 설정을 PC에 저장하고 다음 실행 때 다시 사용합니다.
- **전역 단축키:** 오버레이 표시와 게임 클릭 통과 기능을 전환합니다.

## ⬇️ 다운로드 및 실행

1. [Releases 페이지](https://github.com/alleyhos/Chzzk_Youtube_Overlay/releases)에서 최신 ZIP 파일을 받습니다.
2. ZIP 압축을 풉니다.
3. `Chzzk_Youtube_Soop_Overlay.exe`를 실행합니다.
4. **플랫폼 연결** 카테고리에서 원하는 방송 주소를 입력하고 연결합니다.

## 🔗 플랫폼 연결 방법

### 치지직

1. **플랫폼 연결** 카테고리의 치지직 주소 칸에 채널 또는 라이브 주소를 붙여넣습니다.
   - 예: `https://chzzk.naver.com/live/채널ID`
2. **치지직 연결**을 누릅니다.
3. 방송이 꺼져 있으면 앱이 채널을 확인하며 기다리고, 방송이 시작되면 채팅 연결을 시도합니다.

치지직은 공개 채팅 웹 연결을 이용하는 비공식 방식입니다. 서비스 변경이나 접속 제한에 따라 연결 방식이 바뀌거나 일시적으로 실패할 수 있으며, 앱은 자동 재연결을 시도합니다.

### YouTube

> Google Cloud 프로젝트 및 결제 카드 없이 사용하는 연결 방식으로 안내되어 있습니다.

1. **플랫폼 연결** 카테고리의 YouTube 주소 칸에 라이브 방송 또는 채팅 팝아웃 주소를 붙여넣습니다.
2. **YouTube 연결**을 누릅니다.
3. **설정 저장**을 누르면 다음 실행 때 저장된 방송 주소를 사용합니다.

입력 가능한 주소 형식:

| 형식 | 예시 |
|---|---|
| 방송 페이지 | `https://www.youtube.com/watch?v=동영상ID` |
| 라이브 주소 | `https://www.youtube.com/live/동영상ID` |
| 채팅 팝아웃 | `https://www.youtube.com/live_chat?v=동영상ID&is_popout=1` |
| 동영상 ID | 11자리 동영상 ID |

### SOOP

1. **플랫폼 연결** 카테고리의 SOOP 칸에 `play.sooplive.com/채널ID` 방송 주소 또는 채널 ID를 입력합니다.
2. **SOOP 연결**을 누릅니다.
3. 방송이 꺼져 있으면 10초마다 다시 확인합니다.

## 🎮 오버레이 조작

| 단축키 | 기능 |
|---|---|
| `Ctrl + Alt + O` | 오버레이 숨김 / 표시 |
| `Ctrl + Alt + P` | 게임 클릭 통과 켜기 / 끄기 |

- 오버레이 위쪽을 드래그해 위치를 옮길 수 있습니다.
- 게임은 **창 모드** 또는 **테두리 없는 창 모드**를 권장합니다.
- 독점 전체 화면에서는 게임이 오버레이를 덮을 수 있습니다.
- OBS 게임 캡처는 별도 오버레이 창을 제외할 수 있습니다. 디스플레이 캡처는 오버레이까지 방송 화면에 잡힐 수 있습니다.

## 🔒 데이터 및 개인정보

- 채널·방송 주소와 화면 설정은 `%LOCALAPPDATA%\\ChzzkOverlay\\settings.json`에 저장됩니다.
- 채팅은 이 PC에서 각 플랫폼에 직접 연결하며, 별도 중계 서버를 사용하지 않습니다.
- 로그인 토큰이나 앱 Secret을 저장하거나 요청하지 않습니다.

## ⚠️ 유의사항

- 치지직 연결은 공개 채팅 웹 연결을 이용하는 비공식 방식입니다.
- 각 플랫폼의 페이지 구조나 접속 정책이 변경되면 연결이 일시적으로 실패할 수 있습니다.
- 플랫폼별 연결 상태 및 동작은 실제 방송 환경과 서비스 변경에 영향을 받을 수 있습니다.

## 📄 라이선스 및 크레딧

포함된 Agash-YTLiveChat 관련 라이선스 고지는 [LICENSES/Agash-YTLiveChat-MIT.txt](LICENSES/Agash-YTLiveChat-MIT.txt)를 확인해 주세요. 원문 저작권 및 MIT 라이선스 문구를 변경하지 않고 함께 제공합니다.

---

<p align="center">
  Made by <strong>alleyhos2_17607 (소방호스)</strong>
</p>
