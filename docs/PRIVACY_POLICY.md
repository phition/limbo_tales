# 개인정보처리방침 (Privacy Policy)

**시행일자**: 2026년 10월 2일  
**적용 대상**: Project: Limbo Tales (패키지명: `com.limbo.tales`)  
**제공자**: Limbo Team (이하 "개발사")

---

개발사는 이용자(이하 "이용자" 또는 "회원")의 개인정보를 소중하게 생각하며, 「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」, 그리고 Google Play 개발자 배포 정책(Google Play Developer Policy)을 준수합니다. 본 개인정보처리방침은 개발사가 제공하는 모바일 및 웹 게임 서비스 **『Project: Limbo Tales』**(이하 "게임" 또는 "서비스") 이용 시 수집되는 개인정보 항목, 처리 목적, 보유 기간 및 권리 행사 방법 등을 안내합니다.

---

## 1. 수집하는 개인정보의 항목 및 수집 방법

개발사는 서비스 제공을 위해 최소한의 개인정보만을 수집하며, 이용자의 사전 동의 없이 민감한 개인정보(사상, 신념, 건강 등)를 수집하지 않습니다.

### (1) 수집하는 개인정보 항목
1. **회원 가입 및 로그인 (Firebase Authentication)**
   - **이메일 계정 가입 시**: 이메일 주소, 비밀번호(일방향 암호화 처리되어 개발자도 열람 불가), 고유 회원 식별자(UID)
   - **게스트(익명) 로그인 시**: 임의 생성된 고유 회원 식별자(UID)
2. **게임 서비스 이용 및 진행 데이터 (Firebase Realtime Database & 로컬 저장소)**
   - 게임 진행 상태: 성채 인프라 레벨, 보유 자원(골드, 에테르 등), 용병 파티 구성 및 장비/스킬 데이터, 던전 탐험 진행도, 퀘스트 달성 정보
   - 비동기 PVP (아레나): 지휘관 닉네임, 아레나 랭킹 레이팅(Rating), 방어 덱 편성 정보
3. **서비스 이용 과정에서 자동 생성되는 기술 정보**
   - 접속 일시, 서비스 이용 기록, 오류 및 크래시(Crash) 로그, 단말기 OS 종류 및 기본 사양

### (2) 개인정보 수집 방법
- 앱 내 회원가입, 로그인 및 클라우드 동기화 과정에서 이용자의 입력을 통한 수집
- 게임 플레이 중 생성되는 데이터의 클라우드 자동 동기화
- 네트워크 통신 과정에서 시스템에 의해 자동 수집

---

## 2. 개인정보의 수집 및 이용 목적

수집된 개인정보는 다음의 목적에 한하여 이용됩니다.
1. **회원 식별 및 계정 관리**: 회원제 서비스 이용에 따른 본인 식별, 중복 가입 방지, 비인가 이용 방지
2. **게임 진행 데이터 저장 및 동기화**: 기기 변경, 앱 재설치 시에도 기존 진행도를 유지할 수 있도록 클라우드 세이브(Cloud Save) 제공
3. **아레나 랭킹 및 대전 매칭**: 다른 이용자와의 비동기 PVP 결투 제공, 실시간 랭킹 산정 및 순위 표시
4. **서비스 안정성 및 기술 지원**: 서비스 품질 개선, 네트워크 오류 해결, 치팅 및 비정상적 플레이 방지

---

## 3. 개인정보의 처리 위탁 및 제3자 제공

개발사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 원활한 클라우드 인프라 제공 및 안정적인 데이터베이스 운영을 위해 아래와 같이 전문 클라우드 인프라 서비스를 위탁 운영하고 있습니다.

| 수탁업체 | 위탁 업무 내용 | 개인정보의 보유 및 이용 기간 |
| :--- | :--- | :--- |
| **Google LLC (Google Firebase)** | 사용자 인증(Firebase Auth), 실시간 데이터베이스(Firebase Realtime DB), 정적 리소스 호스팅 | 회원 탈퇴 시 또는 서비스 종료 시까지 |

- 해당 위탁업체는 국제 보안 표준을 준수하며, 개발사의 게임 서비스 운영 목적 외에는 이용자의 개인정보를 처리하지 않습니다.

---

## 4. 개인정보의 보유 및 이용 기간

개발사는 원칙적으로 개인정보의 수집 및 이용 목적이 달성되면 해당 정보를 지체 없이 파기합니다.
1. **회원 탈퇴 시**: 계정 삭제 요청 즉시 클라우드에 저장된 모든 데이터(진행도, 닉네임, 인증 정보)를 영구 삭제합니다.
2. **앱 내 데이터 초기화 시**: 이용자가 게임 내 [설정] 메뉴의 『데이터 초기화』 기능을 실행할 경우 로컬 캐시 및 Firebase 클라우드 세이브 데이터가 즉시 삭제됩니다.
3. **관계 법령에 의한 보존**: 법령에서 정한 보존 의무가 있는 경우 해당 법정 기간 동안 안전하게 보관 후 파기합니다.

---

## 5. 개인정보의 파기 절차 및 방법

1. **파기 절차**: 목적이 달성된 개인정보는 내부 방침 및 관련 법령에 따라 파기됩니다.
2. **파기 방법**:
   - 전자적 파일 형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법(Database Record Drop / Auth Account Delete)을 사용하여 영구 삭제합니다.

---

## 6. 이용자 및 법정대리인의 권리와 그 행사 방법

1. 이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있으며, 계정 삭제 및 데이터 파기를 요청할 수 있습니다.
2. **앱 내 직접 삭제**: 
   - 게임 내 **[설정]** 메뉴를 통해 언제든지 로그아웃 또는 **[데이터 완전 초기화]**를 수행하여 클라우드 데이터를 즉시 영구 삭제할 수 있습니다.
3. **개발자 문의를 통한 삭제**:
   - 본 방침 하단의 개인정보 보호책임자 이메일로 계정 UID 또는 가입 이메일을 기재하여 탈퇴/삭제를 요청하시면 본인 확인 후 지체 없이 영구 파기합니다.
4. 만 14세 미만 아동의 경우, 법정대리인은 아동의 개인정보에 대한 열람, 정정, 삭제 권리를 행사할 수 있습니다.

---

## 7. 개인정보의 기술적·관리적 보호 조치

개발사는 이용자의 개인정보를 안전하게 관리하기 위해 다음과 같은 조치를 취하고 있습니다.
1. **비밀번호 일방향 암호화**: 회원의 비밀번호는 복호화가 불가능한 형태로 암호화(Hash)되어 저장 및 관리되며, 개발자도 알 수 없습니다.
2. **전송 구간 암호화(HTTPS/SSL)**: 단말기와 서버 간의 모든 데이터 전송은 최신 암호화 통신 프로토콜(HTTPS, WSS)을 적용하여 도청 및 위변조를 방지합니다.
3. **데이터베이스 접근 통제**: Firebase Security Rules를 적용하여 인가된 본인만이 본인의 게임 진행 데이터를 열람·수정할 수 있도록 접근 권한을 철저히 격리합니다.

---

## 8. 만 14세 미만 아동의 개인정보 보호

1. 본 게임 서비스는 모든 연령층이 즐길 수 있는 다크 판타지 텍스트 RPG이나, 만 14세 미만 아동의 회원 가입 시 법정대리인의 동의가 필요할 수 있습니다.
2. 만 14세 미만 아동의 개인정보를 수집할 경우 최소한의 필요 정보(게임 진행 데이터 등)만 수집하며 마케팅 목적으로 활용하지 않습니다.

---

## 9. 개인정보 보호책임자 및 문의처

이용자는 서비스를 이용하며 발생하는 모든 개인정보 보호 관련 민원, 계정 삭제 요청, 정책 문의를 아래의 책임자에게 문의하실 수 있습니다.

- **개인정보 보호책임자**: Limbo Team 개인정보 관리팀
- **문의 이메일**: `phitionv4@gmail.com`
- **처리 기한**: 접수 후 영업일 기준 3일 이내 신속하게 답변 및 조치

---

## 10. 개인정보처리방침의 변경 및 고지

본 개인정보처리방침은 법령, 정책 또는 보안 기술의 변경에 따라 내용이 추가, 삭제 및 수정될 수 있습니다. 개정 시에는 게임 내 공지사항 또는 마켓 업데이트 내역을 통해 변경 사유와 효력 발생일을 최소 7일 전부터 사전 고지합니다.

- **공고일자**: 2026년 10월 2일
- **시행일자**: 2026년 10월 2일

---

<br/>

# Privacy Policy (English Summary)

**Effective Date**: October 2, 2026  
**Application**: Project: Limbo Tales (Package: `com.limbo.tales`)  
**Developer**: Limbo Team

Limbo Team ("we", "our", or "us") is dedicated to protecting your privacy. This Privacy Policy explains how our mobile and web game, **Project: Limbo Tales**, handles user information in compliance with the Google Play Developer Policy.

### 1. Information We Collect
- **Account Credentials**: Email address and encrypted password via Firebase Authentication (if registered), or anonymous user ID (UID).
- **Game Progress & Cloud Save**: Castle building levels, heroes, party formations, dungeon exploration floors, and arena ratings via Firebase Realtime Database.
- **Diagnostics & Technical Logs**: Device OS type, network connection status, and basic crash logs for service optimization.

### 2. Purpose of Use
- To authenticate players and protect user accounts.
- To synchronize game save files across devices.
- To maintain the asynchronous Arena ranking and matchmaking system.
- To resolve bugs, optimize stability, and prevent unauthorized exploits.

### 3. Third-Party Service Providers
We utilize trusted third-party cloud infrastructure:
- **Google LLC (Firebase)**: Authentication, cloud database, and hosting.

### 4. Data Retention & Deletion Rights
- You can reset or delete your cloud save data at any time via the in-game Settings menu (`Reset Data`).
- To request complete account deletion, please contact us at `phitionv4@gmail.com`. Upon verification, your data will be permanently wiped immediately.

### 5. Children's Privacy
We do not knowingly collect personal information from children under the age required by local laws without parental consent.

### 6. Contact Us
For any privacy-related questions or data deletion requests:
- **Email**: `phitionv4@gmail.com`
