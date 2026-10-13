package com.limbo.tales;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // 상단 상태 표시줄(Status Bar) 아래부터 웹뷰가 그려지도록 설정
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
    }
}
