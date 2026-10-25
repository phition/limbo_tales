package com.limbo.tales;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.games.AchievementsClient;
import com.google.android.gms.games.GamesSignInClient;
import com.google.android.gms.games.LeaderboardsClient;
import com.google.android.gms.games.PlayGames;
import com.google.android.gms.games.Player;
import com.google.android.gms.games.PlayerLevelInfo;
import com.google.android.gms.games.PlayersClient;

/**
 * 🎮 Google Play Games Services v2 Capacitor Native Plugin
 * - 인증 확인 (isAuthenticated) 및 수동 로그인 (signIn)
 * - 플레이어 프로필 조회 (getCurrentPlayer)
 * - 백엔드/Firebase 연동용 서버 인증 코드 요청 (requestServerSideAccess)
 * - 업적 달성/증가/네이티브 UI 표시 (unlockAchievement, incrementAchievement, showAchievements)
 * - 리더보드 점수 제출/네이티브 UI 표시 (submitScore, showLeaderboard)
 */
@CapacitorPlugin(name = "PlayGames")
public class PlayGamesPlugin extends Plugin {
    private static final int RC_ACHIEVEMENTS_UI = 9003;
    private static final int RC_LEADERBOARD_UI = 9004;

    private JSObject buildPlayerObject(Player player, boolean isAuthenticated) {
        JSObject ret = new JSObject();
        ret.put("isAuthenticated", isAuthenticated);
        if (player != null) {
            ret.put("playerId", player.getPlayerId());
            ret.put("displayName", player.getDisplayName());
            if (player.getTitle() != null) {
                ret.put("title", player.getTitle());
            }
            Uri iconUri = player.getIconImageUri();
            if (iconUri != null) {
                ret.put("iconImageUri", iconUri.toString());
            }
            Uri hiResUri = player.getHiResImageUri();
            if (hiResUri != null) {
                ret.put("hiResImageUri", hiResUri.toString());
            }
            PlayerLevelInfo levelInfo = player.getLevelInfo();
            if (levelInfo != null && levelInfo.getCurrentLevel() != null) {
                ret.put("level", levelInfo.getCurrentLevel().getLevelNumber());
            }
        }
        return ret;
    }

    private void resolveWithPlayer(Activity activity, PluginCall call, boolean isAuthenticated) {
        if (!isAuthenticated) {
            JSObject ret = new JSObject();
            ret.put("isAuthenticated", false);
            call.resolve(ret);
            return;
        }

        PlayersClient playersClient = PlayGames.getPlayersClient(activity);
        playersClient.getCurrentPlayer().addOnCompleteListener(playerTask -> {
            if (playerTask.isSuccessful() && playerTask.getResult() != null) {
                call.resolve(buildPlayerObject(playerTask.getResult(), true));
            } else {
                JSObject ret = new JSObject();
                ret.put("isAuthenticated", true);
                call.resolve(ret);
            }
        });
    }

    @PluginMethod
    public void isAuthenticated(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is not available.");
            return;
        }

        GamesSignInClient gamesSignInClient = PlayGames.getGamesSignInClient(activity);
        gamesSignInClient.isAuthenticated().addOnCompleteListener(task -> {
            boolean isAuthenticated = (task.isSuccessful() && task.getResult() != null && task.getResult().isAuthenticated());
            resolveWithPlayer(activity, call, isAuthenticated);
        });
    }

    @PluginMethod
    public void signIn(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is not available.");
            return;
        }

        GamesSignInClient gamesSignInClient = PlayGames.getGamesSignInClient(activity);
        gamesSignInClient.signIn().addOnCompleteListener(task -> {
            boolean isAuthenticated = (task.isSuccessful() && task.getResult() != null && task.getResult().isAuthenticated());
            resolveWithPlayer(activity, call, isAuthenticated);
        });
    }

    @PluginMethod
    public void getCurrentPlayer(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is not available.");
            return;
        }

        PlayersClient playersClient = PlayGames.getPlayersClient(activity);
        playersClient.getCurrentPlayer().addOnCompleteListener(task -> {
            if (task.isSuccessful() && task.getResult() != null) {
                call.resolve(buildPlayerObject(task.getResult(), true));
            } else {
                Exception ex = task.getException();
                call.reject(ex != null ? ex.getMessage() : "Failed to get current player.");
            }
        });
    }

    @PluginMethod
    public void requestServerSideAccess(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is not available.");
            return;
        }

        String serverClientId = call.getString("serverClientId");
        boolean forceRefreshToken = Boolean.TRUE.equals(call.getBoolean("forceRefreshToken", false));
        if (serverClientId == null || serverClientId.trim().isEmpty()) {
            call.reject("serverClientId is required.");
            return;
        }

        GamesSignInClient gamesSignInClient = PlayGames.getGamesSignInClient(activity);
        gamesSignInClient.requestServerSideAccess(serverClientId.trim(), forceRefreshToken)
            .addOnCompleteListener(task -> {
                if (task.isSuccessful() && task.getResult() != null) {
                    JSObject ret = new JSObject();
                    ret.put("authCode", task.getResult());
                    call.resolve(ret);
                } else {
                    Exception ex = task.getException();
                    call.reject(ex != null ? ex.getMessage() : "Failed to request server side access.");
                }
            });
    }

    @PluginMethod
    public void unlockAchievement(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is not available.");
            return;
        }

        String achievementId = call.getString("achievementId");
        if (achievementId == null || achievementId.trim().isEmpty()) {
            call.reject("achievementId is required.");
            return;
        }

        AchievementsClient client = PlayGames.getAchievementsClient(activity);
        client.unlock(achievementId.trim());
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void incrementAchievement(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is not available.");
            return;
        }

        String achievementId = call.getString("achievementId");
        int steps = call.getInt("steps", 1);
        if (achievementId == null || achievementId.trim().isEmpty()) {
            call.reject("achievementId is required.");
            return;
        }

        AchievementsClient client = PlayGames.getAchievementsClient(activity);
        client.increment(achievementId.trim(), Math.max(1, steps));
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void showAchievements(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is not available.");
            return;
        }

        PlayGames.getAchievementsClient(activity)
            .getAchievementsIntent()
            .addOnSuccessListener(intent -> {
                activity.startActivityForResult(intent, RC_ACHIEVEMENTS_UI);
                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            })
            .addOnFailureListener(e -> call.reject(e.getMessage() != null ? e.getMessage() : "Failed to open Achievements UI."));
    }

    @PluginMethod
    public void submitScore(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is not available.");
            return;
        }

        String leaderboardId = call.getString("leaderboardId");
        Integer scoreInt = call.getInt("score");
        if (leaderboardId == null || leaderboardId.trim().isEmpty() || scoreInt == null) {
            call.reject("leaderboardId and score are required.");
            return;
        }

        LeaderboardsClient client = PlayGames.getLeaderboardsClient(activity);
        client.submitScore(leaderboardId.trim(), scoreInt.longValue());
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void showLeaderboard(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is not available.");
            return;
        }

        String leaderboardId = call.getString("leaderboardId");
        LeaderboardsClient client = PlayGames.getLeaderboardsClient(activity);

        if (leaderboardId != null && !leaderboardId.trim().isEmpty()) {
            client.getLeaderboardIntent(leaderboardId.trim())
                .addOnSuccessListener((Intent intent) -> {
                    activity.startActivityForResult(intent, RC_LEADERBOARD_UI);
                    JSObject ret = new JSObject();
                    ret.put("success", true);
                    call.resolve(ret);
                })
                .addOnFailureListener(e -> call.reject(e.getMessage() != null ? e.getMessage() : "Failed to open Leaderboard UI."));
        } else {
            client.getAllLeaderboardsIntent()
                .addOnSuccessListener((Intent intent) -> {
                    activity.startActivityForResult(intent, RC_LEADERBOARD_UI);
                    JSObject ret = new JSObject();
                    ret.put("success", true);
                    call.resolve(ret);
                })
                .addOnFailureListener(e -> call.reject(e.getMessage() != null ? e.getMessage() : "Failed to open All Leaderboards UI."));
        }
    }
}
