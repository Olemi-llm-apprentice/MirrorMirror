"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useConversation } from "@elevenlabs/react";
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
  ItemDetailsView,
  ShopMapView,
} from "@/components";
import { logger } from "@/lib/logger";

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

  // Refs to always have the latest image data (avoids stale closure issues)
  const userImageBase64Ref = useRef<string | null>(null);
  const userImageMimeTypeRef = useRef<string | null>(null);

  // ===== Content Data =====
  const [genrePreviews, setGenrePreviews] = useState<GenrePreview[]>([]);
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [selectedGenreId, setSelectedGenreId] = useState<GenreId | null>(null);
  const [selectedCoordinate, setSelectedCoordinate] = useState<Coordinate | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);

  // ===== Background Image Generation =====
  const generateSingleImage = useCallback(async (genreId: GenreId, genderParam: Gender, imageBase64?: string | null, imageMimeType?: string | null) => {
    try {
      // Use passed params or fallback to state (passed params are more reliable)
      const base64ToUse = imageBase64 ?? userImageBase64;
      const mimeTypeToUse = imageMimeType ?? userImageMimeType;
      
      logger.debug(`Starting background image generation for ${genreId}...`);
      logger.debug(`User image provided: ${!!base64ToUse}, mime: ${mimeTypeToUse}`);
      
      const res = await fetch("/api/generate-single-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          genre_id: genreId,
          gender: genderParam,
          user_image_base64: base64ToUse,
          user_image_mime_type: mimeTypeToUse,
        }),
      });

      const data = await res.json();

      if (data.success && data.generated_image) {
        logger.debug(`Successfully generated image for ${genreId}`);
        
        // Update the specific genre preview with the generated image
        setGenrePreviews((prev) =>
          prev.map((preview) =>
            preview.genre_id === genreId
              ? {
                  ...preview,
                  preview_image_url: data.generated_image.data_url,
                  cover_image: data.generated_image.data_url,
                  generated_image_url: data.generated_image.data_url,
                  is_generating: false,
                }
              : preview
          )
        );
      } else {
        logger.warn(`Failed to generate image for ${genreId}:`, data.error);
        // Mark as not generating but keep original image
        setGenrePreviews((prev) =>
          prev.map((preview) =>
            preview.genre_id === genreId
              ? { ...preview, is_generating: false }
              : preview
          )
        );
      }
    } catch (error) {
      logger.error(`Error generating image for ${genreId}:`, error);
      setGenrePreviews((prev) =>
        prev.map((preview) =>
          preview.genre_id === genreId
            ? { ...preview, is_generating: false }
            : preview
        )
      );
    }
  }, [userImageBase64, userImageMimeType]);

  // Trigger background image generation when genre previews are set
  const triggerBackgroundGeneration = useCallback((previews: GenrePreview[], genderParam: Gender, imageBase64: string | null, imageMimeType: string | null) => {
    logger.info(`Triggering background generation for ${previews.length} genres, user image: ${!!imageBase64}`);
    
    // Generate images one by one to avoid rate limiting
    previews.forEach((preview, index) => {
      if (preview.is_generating) {
        // Stagger the requests to avoid overwhelming the API
        setTimeout(() => {
          generateSingleImage(preview.genre_id, genderParam, imageBase64, imageMimeType);
        }, index * 2000); // 2 second delay between each request
      }
    });
  }, [generateSingleImage]);

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
    "item-details": "genre-list", // 直接コーデリストに戻る
    "shop-map": "item-details",
  };

  // ===== Client Tools =====
  const clientTools = useMemo(() => ({
    setGender: async ({ gender: g }: { gender: "mens" | "ladies" }): Promise<string> => {
      logger.debug("🔧 [Client Tool] setGender called:", g);
      setGenderState(g);
      const label = g === "mens" ? "メンズ" : "レディース";
      return JSON.stringify({
        success: true,
        gender: g,
        message: `${label}スタイルに設定しました`,
      });
    },

    showImageInputUI: async (): Promise<string> => {
      logger.debug("🔧 [Client Tool] showImageInputUI called");
      setCurrentView("image-input");
      const result = await new Promise<{ success: boolean; image_id: string }>((resolve) => {
        imageUploadResolverRef.current = resolve;
      });
      logger.debug("🔧 [Client Tool] showImageInputUI result:", result);
      return JSON.stringify(result);
    },

    generateCoordinates: async ({ gender: g, image_id }: { gender: string; image_id: string }): Promise<string> => {
      setCurrentView("loading");
      try {
        // Use refs for the latest image data (avoids stale closure issues)
        const currentImageBase64 = userImageBase64Ref.current;
        const currentImageMimeType = userImageMimeTypeRef.current;
        
        logger.info(`generateCoordinates called: gender=${g}, image_id=${image_id}`);
        logger.info(`User image from ref: ${!!currentImageBase64}, mime: ${currentImageMimeType}`);
        
        const res = await fetch("/api/generate-coordinates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gender: g,
            image_id,
            image_base64: currentImageBase64,
            mime_type: currentImageMimeType,
          }),
        });

        const data = await res.json();

        if (data.genre_previews) {
          setGenrePreviews(data.genre_previews);
          setCurrentView("genre-list");

          // Trigger background image generation for each genre
          // Use refs for the latest image data
          triggerBackgroundGeneration(data.genre_previews, g as Gender, currentImageBase64, currentImageMimeType);

          return JSON.stringify({
            success: true,
            generated_count: data.genre_previews.length,
            genre_previews: data.genre_previews,
          });
        }

        setCurrentView("conversation");
        return JSON.stringify({ success: false, error: "生成に失敗しました" });
      } catch (error) {
        logger.error("Generate error:", error);
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
  }), [coordinates, currentView, gender, triggerBackgroundGeneration, userImageBase64, userImageId, userImageMimeType, userLocation, viewHistory]);

  // ===== ElevenLabs Conversation Hook =====
  const conversation = useConversation({
    onConnect: () => {
      logger.info("✅ Connected to ElevenLabs");
    },
    onDisconnect: () => {
      logger.info("❌ Disconnected from ElevenLabs");
    },
    onMessage: (message) => {
      logger.debug("📩 [ElevenLabs] Message:", message);
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
      logger.error("🚨 Conversation error:", error);
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
          logger.error("Agent ID not configured");
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
      logger.error("Failed to start conversation:", error);
    }
  }, [clientTools, conversation, gender, userImageId]);

  // ===== End Conversation =====
  const endConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  // ===== Auto Generate Coordinates after Image Upload =====
  const autoGenerateCoordinates = useCallback(async (imageBase64: string, imageMimeType: string) => {
    // Use current gender or default to "mens"
    const currentGender = gender || "mens";
    
    logger.info(`Auto-generating coordinates: gender=${currentGender}`);
    setCurrentView("loading");
    
    try {
      const res = await fetch("/api/generate-coordinates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gender: currentGender,
          image_id: `img-${Date.now()}`,
          image_base64: imageBase64,
          mime_type: imageMimeType,
        }),
      });

      const data = await res.json();

      if (data.genre_previews) {
        setGenrePreviews(data.genre_previews);
        setCurrentView("genre-list");

        // Trigger background image generation for each genre
        triggerBackgroundGeneration(data.genre_previews, currentGender as Gender, imageBase64, imageMimeType);
        
        logger.info(`Auto-generated ${data.genre_previews.length} genre previews`);
      } else {
        logger.error("Failed to auto-generate coordinates");
        setCurrentView("conversation");
      }
    } catch (error) {
      logger.error("Auto-generate error:", error);
      setCurrentView("conversation");
    }
  }, [gender, triggerBackgroundGeneration]);

  // ===== Image Upload Handler =====
  const handleImageUploaded = useCallback(
    (imageId: string, base64: string, mimeType: string) => {
      logger.info(`Image uploaded: id=${imageId}, base64 length=${base64.length}, mime=${mimeType}`);
      
      // Update both state and refs
      setUserImageId(imageId);
      setUserImageBase64(base64);
      setUserImageMimeType(mimeType);
      
      // Update refs immediately (refs are synchronous, unlike state)
      userImageBase64Ref.current = base64;
      userImageMimeTypeRef.current = mimeType;

      // Resolve the promise for ElevenLabs (if waiting)
      if (imageUploadResolverRef.current) {
        imageUploadResolverRef.current({ success: true, image_id: imageId });
        imageUploadResolverRef.current = null;
      }
      
      // Auto-trigger coordinate generation (don't wait for ElevenLabs)
      autoGenerateCoordinates(base64, mimeType);
    },
    [autoGenerateCoordinates]
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
        const coordinateList = data.coordinates || [];
        setCoordinates(coordinateList);
        setSelectedGenreId(genreId);
        
        // 直接最初のコーディネートを選択してアイテム詳細に遷移
        if (coordinateList.length > 0) {
          const firstCoord = coordinateList[0];
          setSelectedCoordinate(firstCoord);
          setItems(firstCoord.items || []);
          setCurrentView("item-details");
        } else {
          setCurrentView("genre-list");
        }
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
        logger.error("Failed to get shops:", error);
      }
    },
    [userLocation]
  );

  // ===== Render =====
  return (
    <main className="relative min-h-screen">
      {/* Main Content */}
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
  );
}

