package com.limbo.tales;

import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import com.google.android.gms.games.PlayGamesSdk;

public class MainActivity extends BridgeActivity {

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final Runnable hideNavRunnable = this::applyImmersiveStickyNavigationBar;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PlayGamesPlugin.class);
        super.onCreate(savedInstanceState);

        // 🎮 Google Play Games Services v2 SDK 초기화 (앱 구동 시 자동 로그인 확인)
        PlayGamesSdk.initialize(this);

        // 📱 화면 엣지투엣지 및 시스템 바(상단 알림줄 유지 + 하단 네비게이션 바 숨김) 정밀 제어
        setupWindowLayoutAndSystemBars();
    }

    /**
     * 📱 창 레이아웃 및 시스템 인셋 설정:
     * - 데코뷰의 기본 fitsSystemWindows를 해제하여 하단 네비게이션 바 영역이 강제 예약되는 문제 방지
     * - 루트 뷰에 상단 상태바(알림줄) 높이만큼만 정확히 패딩을 적용하여 상단 알림줄 아래부터 웹뷰가 렌더링되도록 격리
     * - 하단 패딩은 네비게이션 바가 숨겨진 동안 0으로 유지하여 화면 맨 하단까지 게임 화면이 100% 꽉 차도록 보장
     *   (네비게이션 바 숨김 실패 기기 / 키보드 표시 시에만 해당 높이만큼 자동 보정)
     */
    private void setupWindowLayoutAndSystemBars() {
        Window window = getWindow();
        if (window == null) return;

        // 1. 전체 화면 확장 모드 (시스템 윈도우 일괄 예약 비활성화)
        WindowCompat.setDecorFitsSystemWindows(window, false);

        // 2. 상태바 및 네비게이션 바 배경색 일체화
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(0xFF0B0D13); // #0b0d13 (다크 테마 배경 일체화)
        window.setNavigationBarColor(0xFF0B0D13);

        // 3. Android 9+ (Pie) 디스플레이 컷아웃(노치) 영역 대응
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams lp = window.getAttributes();
            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            window.setAttributes(lp);
        }

        // 4. 루트 컨텐츠 뷰에 윈도우 인셋 리스너 설정:
        //    상단 알림줄(Status Bar) 높이만큼 패딩을 부여하고 하단은 (숨김 시) 0으로 유지
        //    (Capacitor 내장 SystemBars 인셋 처리는 capacitor.config.ts 에서 비활성화하여 이중 패딩을 방지)
        View contentView = findViewById(android.R.id.content);
        if (contentView != null) {
            // 패딩 영역(상태바 뒤)이 게임 배경색과 일체화되도록 배경 지정
            contentView.setBackgroundColor(0xFF0B0D13);

            ViewCompat.setOnApplyWindowInsetsListener(contentView, (v, windowInsets) -> {
                Insets statusBarInsets = windowInsets.getInsets(WindowInsetsCompat.Type.statusBars());
                Insets displayCutoutInsets = windowInsets.getInsets(WindowInsetsCompat.Type.displayCutout());
                // 숨김 상태의 네비게이션 바는 0, (OEM 등으로) 숨김 실패 시에는 실제 높이를 반환
                Insets navBarInsets = windowInsets.getInsets(WindowInsetsCompat.Type.navigationBars());
                Insets imeInsets = windowInsets.getInsets(WindowInsetsCompat.Type.ime());

                int topPadding = Math.max(statusBarInsets.top, displayCutoutInsets.top);
                int leftPadding = Math.max(navBarInsets.left, displayCutoutInsets.left);
                int rightPadding = Math.max(navBarInsets.right, displayCutoutInsets.right);
                // 하단: 네비게이션 바가 숨겨져 있으면 0 → 게임 화면이 화면 끝까지 꽉 참
                //       키보드(IME)가 열리면 키보드 높이만큼 올려 입력창이 가려지지 않도록 보정
                int bottomPadding = Math.max(navBarInsets.bottom, imeInsets.bottom);

                v.setPadding(leftPadding, topPadding, rightPadding, bottomPadding);

                // 웹뷰 내부의 CSS env(safe-area-inset-top)과의 중복 패딩을 방지하기 위해 소비된 인셋 전달
                return new WindowInsetsCompat.Builder(windowInsets)
                        .setInsets(WindowInsetsCompat.Type.statusBars(), Insets.NONE)
                        .setInsets(WindowInsetsCompat.Type.navigationBars(), Insets.NONE)
                        .setInsets(WindowInsetsCompat.Type.displayCutout(), Insets.NONE)
                        .setInsets(WindowInsetsCompat.Type.ime(), Insets.NONE)
                        .build();
            });
        }

        // 5. 하단 네비게이션 바 숨김(몰입형 스티키 모드) 1차 적용
        applyImmersiveStickyNavigationBar();

        // 6. 사용자의 스와이프나 시스템 알림 등 외부 요인으로 네비게이션 바가 나타났을 때 자동 재숨김
        window.getDecorView().setOnSystemUiVisibilityChangeListener(visibility -> {
            if ((visibility & View.SYSTEM_UI_FLAG_HIDE_NAVIGATION) == 0) {
                mainHandler.removeCallbacks(hideNavRunnable);
                mainHandler.postDelayed(hideNavRunnable, 600);
            }
        });
    }

    /**
     * 🛡️ 상단 알림줄(Status Bar)은 항상 선명하게 유지하고,
     * 하단 네비게이션 바(소프트키/제스처 바)만 단단하게 숨기는 몰입형 스티키(Immersive Sticky) 메서드
     */
    private void applyImmersiveStickyNavigationBar() {
        Window window = getWindow();
        if (window == null) return;

        View decorView = window.getDecorView();

        // [방법 1] WindowInsetsControllerCompat (Android 11+ 권장 표준 및 하위 호환)
        WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(window, decorView);
        if (insetsController != null) {
            // 상단 알림줄(상태바)은 항상 보이도록 보장
            insetsController.show(WindowInsetsCompat.Type.statusBars());
            // 하단 네비게이션 바 숨김
            insetsController.hide(WindowInsetsCompat.Type.navigationBars());
            // 하단 스와이프 시 일시적으로 떴다가 자동으로 다시 가려지는 몰입 모드
            insetsController.setSystemBarsBehavior(
                    WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            );
        }

        // [방법 2] 하위 안드로이드 버전 및 특정 OEM(삼성 One UI, 샤오미 MIUI 등) 완벽 방어를 위한 레거시 플래그 병행 설정
        //  - LAYOUT_STABLE 은 숨겨진 네비게이션 바 높이까지 인셋으로 보고하여(Android 10 이하) 하단 빈 공간을 만들므로 제외
        //  - LAYOUT_FULLSCREEN 은 StatusBar 플러그인(overlaysWebView=false)이 해제한 엣지투엣지 레이아웃을 복구
        int flags = View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;

        decorView.setSystemUiVisibility((decorView.getSystemUiVisibility() & ~View.SYSTEM_UI_FLAG_LAYOUT_STABLE) | flags);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        // 🎮 광고 시청 후, 알림창을 내렸다가 올렸을 때, 백그라운드 복귀 등 포커스 재획득 시 네비게이션 바 강제 재숨김
        if (hasFocus) {
            applyImmersiveStickyNavigationBar();
            // 일부 기기에서 지연 노출되는 문제를 방지하기 위해 300ms 후 한 번 더 보강 실행
            mainHandler.postDelayed(hideNavRunnable, 300);
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        applyImmersiveStickyNavigationBar();
        mainHandler.postDelayed(hideNavRunnable, 300);
    }
}
