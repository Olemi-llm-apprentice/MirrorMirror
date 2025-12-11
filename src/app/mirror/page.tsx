"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useConversation } from "@elevenlabs/react";
import Link from "next/link";
import type {
  AppView,
  Gender,
  GenreId,
  GenrePreview,
  Coordinate,
  Item,
  Shop,
  Location,
} from "@/types";
import {
  VoicePanel,
  ConversationPanel,
  ImageInputView,
  LoadingView,
  GenreListView,
  CoordinateListView,
  ItemDetailsView,
  ShopMapView,
} from "@/components";

interface Message {
  source: "user" | "ai";
  text: string;
}

export default function MirrorMirrorApp() {
  // ===== View State =====
  const [currentView, setCurrentView] = useState<AppView>("conversation");

  // ===== User Data =====
  const [gender, setGenderState] = useState<Gender | null>(null);
  const [userImageId, setUserImageId] = useState<string | null>(null);
  const [userImageBase64, setUserImageBase64] = useState<string | null>(null);
  const [userImageMimeType, setUserImageMimeType] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Location | null>(null);

  // ===== Content Data =====
  const [genrePreviews, setGenrePreviews] = useState<GenrePreview[]>([]);
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [selectedGenreId, setSelectedGenreId] = useState<GenreId | null>(null);
  const [selectedCoordinate, setSelectedCoordinate] = useState<Coordinate | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);

  // ===== Conversation =====
  const [messages, setMessages] = useState<Message[]>([]);

  // ===== Promise Resolvers =====
  const imageUploadResolverRef = useRef<((result: { success: boolean; image_id: string }) => void) | null>(null);

  // ===== View History for goBack =====
  const viewHistory: Record<AppView, AppView> = {
    conversation: "conversation",
    "image-input": "conversation",
    loading: "conversation",
    "genre-list": "conversation",
    "coordinate-list": "genre-list",
    "item-details": "coordinate-list",
    "shop-map": "item-details",
  };

  // ===== Client Tools =====
  const clientTools = useMemo(() => ({
    setGender: async ({ gender: g }: { gender: "mens" | "ladies" }): Promise<string> => {
      setGenderState(g);
      const label = g === "mens" ? "メンズ" : "レディース";
      return JSON.stringify({
        success: true,
        gender: g,
        message: `${label}スタイルに設定しました`,
      });
    },

    showImageInputUI: async (): Promise<string> => {
      setCurrentView("image-input");
      const result = await new Promise<{ success: boolean; image_id: string }>((resolve) => {
        imageUploadResolverRef.current = resolve;
      });
      return JSON.stringify(result);
    },

    generateCoordinates: async ({ gender: g, image_id }: { gender: string; image_id: string }): Promise<string> => {
      setCurrentView("loading");
      try {
        const res = await fetch("/api/generate-coordinates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gender: g,
            image_id,
            image_base64: userImageBase64,
            mime_type: userImageMimeType,
          }),
        });

        const data = await res.json();

        if (data.genre_previews) {
          setGenrePreviews(data.genre_previews);
          setCurrentView("genre-list");
          return JSON.stringify({
            success: true,
            generated_count: data.genre_previews.length,
            genre_previews: data.genre_previews,
          });
        }

        setCurrentView("conversation");
        return JSON.stringify({ success: false, error: "生成に失敗しました" });
      } catch (error) {
        console.error("Generate error:", error);
        setCurrentView("conversation");
        return JSON.stringify({ success: false, error: "生成中にエラーが発生しました" });
      }
    },

    selectGenre: async ({ genre_id }: { genre_id: string }): Promise<string> => {
      setCurrentView("loading");
      try {
        const res = await fetch("/api/generate-remaining", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            genre_id,
            image_id: userImageId,
            gender,
          }),
        });

        const data = await res.json();
        setCoordinates(data.coordinates || []);
        setSelectedGenreId(genre_id as GenreId);
        setCurrentView("coordinate-list");

        return JSON.stringify({ success: true, count: data.coordinates?.length || 0 });
      } catch {
        setCurrentView("genre-list");
        return JSON.stringify({ success: false, error: "コーデ取得に失敗しました" });
      }
    },

    selectCoordinate: async ({ coordinate_index }: { coordinate_index: number }): Promise<string> => {
      const coord = coordinates[coordinate_index];

      if (!coord) {
        return JSON.stringify({ success: false, error: "コーデが見つかりません" });
      }

      setSelectedCoordinate(coord);
      setItems(coord.items || []);
      setCurrentView("item-details");

      const total = (coord.items || []).reduce((sum, item) => sum + item.price, 0);

      return JSON.stringify({
        success: true,
        coordinate_name: coord.name,
        items_count: coord.items?.length || 0,
        total_price: total,
      });
    },

    showShopMap: async ({ item_id }: { item_id: string }): Promise<string> => {
      let location = userLocation;
      if (!location) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
            });
          });
          location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(location);
        } catch {
          location = { lat: 35.658034, lng: 139.701636 }; // Default: Shibuya
        }
      }

      try {
        const res = await fetch(
          `/api/items/${item_id}/shops?lat=${location.lat}&lng=${location.lng}`
        );
        const data = await res.json();

        setShops(data.shops || []);
        setCurrentView("shop-map");

        const nearest = data.shops?.[0];
        return JSON.stringify({
          displayed: true,
          shop_count: data.shops?.length || 0,
          nearest_shop: nearest?.name,
          distance: nearest?.walkingMinutes
            ? `徒歩${nearest.walkingMinutes}分`
            : null,
        });
      } catch {
        return JSON.stringify({ displayed: false, error: "店舗情報取得に失敗しました" });
      }
    },

    goBack: async (): Promise<string> => {
      const prevView = viewHistory[currentView];
      setCurrentView(prevView);
      return JSON.stringify({ success: true, current_view: prevView });
    },
  }), [coordinates, currentView, gender, userImageBase64, userImageId, userImageMimeType, userLocation, viewHistory]);

  // ===== ElevenLabs Conversation Hook =====
  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs");
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs");
    },
    onMessage: (message) => {
      if (message.message) {
        setMessages((prev) => [
          ...prev,
          {
            source: message.source === "user" ? "user" : "ai",
            text: message.message,
          },
        ]);
      }
    },
    onError: (error) => {
      console.error("Conversation error:", error);
    },
  });

  // ===== Start Conversation =====
  const startConversation = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Try signed URL first (more secure), fallback to public agent
      let sessionConfig: {
        signedUrl?: string;
        agentId?: string;
        clientTools: typeof clientTools;
        dynamicVariables: { gender: string; user_image_id: string };
      };

      try {
        const res = await fetch("/api/elevenlabs/signed-url");
        if (res.ok) {
          const { signedUrl } = await res.json();
          sessionConfig = {
            signedUrl,
            clientTools,
            dynamicVariables: {
              gender: gender || "",
              user_image_id: userImageId || "",
            },
          };
        } else {
          throw new Error("Signed URL not available");
        }
      } catch {
        // Fallback to public agent
        const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
        if (!agentId) {
          console.error("Agent ID not configured");
          return;
        }
        sessionConfig = {
          agentId,
          clientTools,
          dynamicVariables: {
            gender: gender || "",
            user_image_id: userImageId || "",
          },
        };
      }

      await conversation.startSession(sessionConfig);
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  }, [clientTools, conversation, gender, userImageId]);

  // ===== End Conversation =====
  const endConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  // ===== Image Upload Handler =====
  const handleImageUploaded = useCallback(
    (imageId: string, base64: string, mimeType: string) => {
      setUserImageId(imageId);
      setUserImageBase64(base64);
      setUserImageMimeType(mimeType);

      if (imageUploadResolverRef.current) {
        imageUploadResolverRef.current({ success: true, image_id: imageId });
        imageUploadResolverRef.current = null;
      }
    },
    []
  );

  // ===== Manual Gender Selection =====
  const handleSelectGender = useCallback((g: Gender) => {
    setGenderState(g);
  }, []);

  // ===== Navigation Handlers =====
  const handleGoBack = useCallback(() => {
    const prevView = viewHistory[currentView];
    setCurrentView(prevView);
  }, [currentView, viewHistory]);

  const handleSelectGenre = useCallback(
    async (genreId: GenreId) => {
      setCurrentView("loading");
      try {
        const res = await fetch("/api/generate-remaining", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            genre_id: genreId,
            image_id: userImageId,
            gender,
          }),
        });

        const data = await res.json();
        setCoordinates(data.coordinates || []);
        setSelectedGenreId(genreId);
        setCurrentView("coordinate-list");
      } catch {
        setCurrentView("genre-list");
      }
    },
    [gender, userImageId]
  );

  const handleSelectCoordinate = useCallback(
    (index: number) => {
      const coord = coordinates[index];
      if (coord) {
        setSelectedCoordinate(coord);
        setItems(coord.items || []);
        setCurrentView("item-details");
      }
    },
    [coordinates]
  );

  const handleShowShopMap = useCallback(
    async (itemId: string) => {
      let location = userLocation;
      if (!location) {
        try {
          const pos = await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
              });
            }
          );
          location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(location);
        } catch {
          location = { lat: 35.658034, lng: 139.701636 };
        }
      }

      try {
        const res = await fetch(
          `/api/items/${itemId}/shops?lat=${location.lat}&lng=${location.lng}`
        );
        const data = await res.json();
        setShops(data.shops || []);
        setCurrentView("shop-map");
      } catch (error) {
        console.error("Failed to get shops:", error);
      }
    },
    [userLocation]
  );

  // ===== Render =====
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo - Link to home */}
          <Link href="/" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
            <div className="text-red-600 text-3xl font-bold">★</div>
            <h1 className="text-2xl font-bold">MirrorMirror</h1>
          </Link>

          {/* Right side - Optional navigation */}
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
              Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative min-h-screen bg-gradient-to-b from-amber-50 to-stone-100">
        {currentView === "conversation" && (
          <ConversationPanel
            gender={gender}
            onSelectGender={handleSelectGender}
            messages={messages}
          />
        )}

        {currentView === "image-input" && (
          <ImageInputView
            onImageUploaded={handleImageUploaded}
            onBack={handleGoBack}
          />
        )}

        {currentView === "loading" && <LoadingView />}

        {currentView === "genre-list" && (
          <GenreListView
            genres={genrePreviews}
            onSelectGenre={handleSelectGenre}
            onBack={handleGoBack}
          />
        )}

        {currentView === "coordinate-list" && selectedGenreId && (
          <CoordinateListView
            coordinates={coordinates}
            genreId={selectedGenreId}
            onSelectCoordinate={handleSelectCoordinate}
            onBack={handleGoBack}
          />
        )}

        {currentView === "item-details" && selectedCoordinate && (
          <ItemDetailsView
            coordinate={selectedCoordinate}
            items={items}
            onShowShopMap={handleShowShopMap}
            onBack={handleGoBack}
          />
        )}

        {currentView === "shop-map" && (
          <ShopMapView
            shops={shops}
            userLocation={userLocation}
            onBack={handleGoBack}
          />
        )}

        {/* Voice Panel - Always visible */}
        <VoicePanel
          isConnected={conversation.status === "connected"}
          isSpeaking={conversation.isSpeaking}
          isListening={conversation.status === "connected" && !conversation.isSpeaking}
          onStart={startConversation}
          onEnd={endConversation}
        />
      </main>
    </div>
  );
}

