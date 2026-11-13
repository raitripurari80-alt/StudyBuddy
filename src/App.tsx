import { useCallback, useEffect, useState } from "react";
import { ConnectionsScreen } from "./components/ConnectionsScreen";
import { CopilotScreen } from "./components/CopilotScreen";
import { DiscoverScreen } from "./components/DiscoverScreen";
import { Navbar } from "./components/Navbar";
import { PartnerDetailsScreen } from "./components/PartnerDetailsScreen";
import { ProfileScreen } from "./components/ProfileScreen";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { SAMPLE_PARTNERS, TOPIC_SUGGESTIONS } from "./data/studyData";
import { StorageService } from "./services/storageService";
import type {
  AppState,
  ConnectionStatus,
  ConnectionsTab,
  CopilotState,
  FilterState,
  ScreenId,
  UserProfile,
} from "./types";

interface ToastItem {
  id: number;
  message: string;
}

export default function App() {
  const [state, setState] = useState<AppState>(() => StorageService.load());
  const [previousScreen, setPreviousScreen] = useState<ScreenId>("discover");
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    StorageService.save(state);
  }, [state]);

  const notify = useCallback((message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const navigate = useCallback((screen: ScreenId, partnerId?: string) => {
    setState((prev) => {
      if (
        screen === "partner-details" &&
        prev.currentScreen !== "partner-details"
      ) {
        setPreviousScreen(prev.currentScreen);
      }
      return {
        ...prev,
        currentScreen: screen,
        selectedPartnerId:
          partnerId !== undefined ? partnerId : prev.selectedPartnerId,
      };
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const getConnectionStatus = useCallback(
    (partnerId: string): ConnectionStatus => {
      if (state.connections.accepted.includes(partnerId)) return "accepted";
      if (state.connections.incoming.includes(partnerId)) return "incoming";
      if (state.connections.sent.includes(partnerId)) return "sent";
      return "none";
    },
    [state.connections]
  );

  const handleStartDemo = () => {
    setState((prev) => ({
      ...prev,
      hasOnboarded: true,
      currentScreen: "discover",
      user: {
        name: "Alex Rivera",
        school: "Oakridge State University",
        subjects: ["Biology", "Computer Science", "Calculus"],
        level: "Intermediate",
        availability: ["Wednesday Evenings", "Weekend Mornings"],
        meetingPreference: "Online",
        goal: "Stay consistent each week and practice explaining tough concepts aloud.",
      },
      copilot: {
        ...prev.copilot,
        subject: "Biology",
        topic: "Cellular Respiration & ATP",
      },
    }));
    notify("Loaded sample student profile for Alex Rivera.");
  };

  const handleSaveProfile = (profile: UserProfile) => {
    setState((prev) => {
      const nextSubject = profile.subjects.includes(prev.copilot.subject)
        ? prev.copilot.subject
        : profile.subjects[0] || prev.copilot.subject;
      const nextTopic =
        nextSubject !== prev.copilot.subject
          ? TOPIC_SUGGESTIONS[nextSubject]?.[0] || `${nextSubject} Key Concepts`
          : prev.copilot.topic;

      return {
        ...prev,
        hasOnboarded: true,
        currentScreen: "discover",
        user: profile,
        copilot: {
          ...prev.copilot,
          subject: nextSubject,
          topic: nextTopic,
        },
      };
    });
    notify("Study profile saved.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleConnect = (partnerId: string) => {
    const partner = SAMPLE_PARTNERS.find((p) => p.id === partnerId);
    setState((prev) => {
      if (
        prev.connections.sent.includes(partnerId) ||
        prev.connections.accepted.includes(partnerId)
      ) {
        return prev;
      }
      return {
        ...prev,
        connections: {
          ...prev.connections,
          sent: [...prev.connections.sent, partnerId],
        },
      };
    });
    if (partner) {
      notify(`Connection request sent to ${partner.name}.`);
    }
  };

  const handleCancelSent = (partnerId: string) => {
    setState((prev) => ({
      ...prev,
      connections: {
        ...prev.connections,
        sent: prev.connections.sent.filter((id) => id !== partnerId),
      },
    }));
    notify("Connection request withdrawn.");
  };

  const handleAccept = (partnerId: string) => {
    const partner = SAMPLE_PARTNERS.find((p) => p.id === partnerId);
    setState((prev) => ({
      ...prev,
      connections: {
        incoming: prev.connections.incoming.filter((id) => id !== partnerId),
        sent: prev.connections.sent.filter((id) => id !== partnerId),
        accepted: prev.connections.accepted.includes(partnerId)
          ? prev.connections.accepted
          : [...prev.connections.accepted, partnerId],
      },
    }));
    notify(
      `You and ${partner ? partner.name : "your partner"} are now study partners.`
    );
  };

  const handleDecline = (partnerId: string) => {
    setState((prev) => ({
      ...prev,
      connections: {
        ...prev.connections,
        incoming: prev.connections.incoming.filter((id) => id !== partnerId),
      },
    }));
    notify("Request declined.");
  };

  const handleSimulateAccept = (partnerId: string) => {
    const partner = SAMPLE_PARTNERS.find((p) => p.id === partnerId);
    setState((prev) => ({
      ...prev,
      connections: {
        ...prev.connections,
        sent: prev.connections.sent.filter((id) => id !== partnerId),
        accepted: prev.connections.accepted.includes(partnerId)
          ? prev.connections.accepted
          : [...prev.connections.accepted, partnerId],
      },
    }));
    notify(
      `Demo: ${partner ? partner.name : "Partner"} accepted your request.`
    );
  };

  const handleLaunchCopilot = (partnerId: string) => {
    const partner = SAMPLE_PARTNERS.find((p) => p.id === partnerId);
    setState((prev) => {
      let nextSubject = prev.copilot.subject;
      let nextTopic = prev.copilot.topic;
      if (partner) {
        const shared = partner.subjects.find((s) =>
          prev.user.subjects.includes(s)
        );
        if (shared) {
          nextSubject = shared;
          nextTopic =
            TOPIC_SUGGESTIONS[shared]?.[0] || `${shared} Key Concepts`;
        }
      }
      return {
        ...prev,
        currentScreen: "copilot",
        copilot: {
          ...prev.copilot,
          partnerId,
          subject: nextSubject,
          topic: nextTopic,
        },
      };
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdateFilters = (filters: FilterState) => {
    setState((prev) => ({ ...prev, filters }));
  };

  const handleChangeConnectionsTab = (connectionsTab: ConnectionsTab) => {
    setState((prev) => ({ ...prev, connectionsTab }));
  };

  const handleUpdateCopilot = (copilot: CopilotState) => {
    setState((prev) => ({ ...prev, copilot }));
  };

  const handleResetDemo = () => {
    const fresh = StorageService.reset();
    setState(fresh);
    notify("Demo data reset to initial state.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeScreen: ScreenId =
    !state.hasOnboarded && state.currentScreen !== "profile"
      ? "welcome"
      : state.currentScreen;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Navbar
        hasOnboarded={state.hasOnboarded}
        currentScreen={activeScreen}
        incomingCount={state.connections.incoming.length}
        onNavigate={(screen) => navigate(screen)}
        onResetDemo={handleResetDemo}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-24 md:pb-14">
        {activeScreen === "welcome" && (
          <WelcomeScreen
            onCreateProfile={() => navigate("profile")}
            onStartDemo={handleStartDemo}
          />
        )}

        {activeScreen === "profile" && (
          <ProfileScreen
            user={state.user}
            hasOnboarded={state.hasOnboarded}
            onSave={handleSaveProfile}
            onBackToDiscover={() => navigate("discover")}
            onNotify={notify}
          />
        )}

        {activeScreen === "discover" && (
          <DiscoverScreen
            user={state.user}
            filters={state.filters}
            getStatus={getConnectionStatus}
            onUpdateFilters={handleUpdateFilters}
            onEditProfile={() => navigate("profile")}
            onViewPartner={(id) => navigate("partner-details", id)}
            onConnect={handleConnect}
            onAccept={handleAccept}
            onLaunchCopilot={handleLaunchCopilot}
            onNotify={notify}
          />
        )}

        {activeScreen === "partner-details" && (
          <PartnerDetailsScreen
            partnerId={state.selectedPartnerId}
            user={state.user}
            getStatus={getConnectionStatus}
            onBack={() => navigate(previousScreen || "discover")}
            onConnect={handleConnect}
            onCancelSent={handleCancelSent}
            onAccept={handleAccept}
            onDecline={handleDecline}
            onSimulateAccept={handleSimulateAccept}
            onLaunchCopilot={handleLaunchCopilot}
            onNotify={notify}
          />
        )}

        {activeScreen === "connections" && (
          <ConnectionsScreen
            user={state.user}
            connections={state.connections}
            activeTab={state.connectionsTab}
            onChangeTab={handleChangeConnectionsTab}
            onBrowsePartners={() => navigate("discover")}
            onViewPartner={(id) => navigate("partner-details", id)}
            onAccept={handleAccept}
            onDecline={handleDecline}
            onCancelSent={handleCancelSent}
            onSimulateAccept={handleSimulateAccept}
            onLaunchCopilot={handleLaunchCopilot}
          />
        )}

        {activeScreen === "copilot" && (
          <CopilotScreen
            copilot={state.copilot}
            acceptedPartnerIds={state.connections.accepted}
            userSubjects={state.user.subjects}
            userLevel={state.user.level}
            onUpdateCopilot={handleUpdateCopilot}
            onNotify={notify}
          />
        )}
      </main>

      {/* Toast notifications */}
      <div
        aria-live="polite"
        className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="rounded-lg border border-orange-500/40 bg-zinc-900 px-4 py-3 text-base font-medium text-zinc-100 shadow-lg"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
