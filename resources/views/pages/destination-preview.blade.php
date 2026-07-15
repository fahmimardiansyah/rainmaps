@extends('layouts.app')

@section('google-maps')
@endsection

@section('title', 'Destination Preview - Weather Maps')

@section('content')

    <body class="bg-background text-on-surface font-body-lg overflow-hidden">
        <!-- Map Base Layer -->
        {{-- <div class="fixed inset-0 z-0 touch-pan-x touch-pan-y" id="map-container">
            <div class="w-[150%] h-[150%] -ml-[25%] -mt-[25%] grayscale opacity-40 bg-cover bg-center"
                data-location="Malang, Indonesia"
                style="
          background-image: url(&quot;https://lh3.googleusercontent.com/aida-public/AB6AXuD0pmXIVhzyb8AjQpQfg6lAkFFk2EVo-mLdfdO2HfxdZ7HTln8y1cm5nxl1E4_Z5pY8JInvsc3SImQR4bL2oQ-uB0vb0dSvnLCS9dgOEGN-Mf0k8p4S6MitqptBlW8hjx7ZxHmfxTtBW507Xe_8EC9tMo738GsoX7e8WL4R9-5MxgdfctLl4tDPqSgibGiSfD0YW2vKbAe-3RTd5XtoEkFid6pbz8UWnPN5glkrtvQJY853WQG9ePwJOmN050QLD3GplteoXX0G-sYp&quot;);
        ">
            </div>
            <!-- Animated Rain Overlay (Heatmap Effect) -->
            <!-- Route Path SVG -->
            <svg class="absolute inset-0 w-full h-full pointer-events-none z-10" viewbox="0 0 400 800">
                <path class="map-path" d="M100,500 L150,450 L200,430 L250,410 L280,350 L310,250" fill="none"
                    stroke="#0061a4" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"></path>
                <!-- Origin Marker -->
                <circle cx="100" cy="500" fill="#0061a4" r="6"></circle>
                <circle class="animate-ping" cx="100" cy="500" fill="#0061a4" opacity="0.3" r="12"></circle>
                <!-- Map Dynamic Markers -->
                <!-- 28° Marker -->
                <g transform="translate(134, 396)">
                    <rect fill="#1a1c1c" height="48" rx="16" width="32"></rect>
                    <text fill="white" font-size="10" font-weight="700" text-anchor="middle" x="16" y="18">
                        28°
                    </text>
                    <text class="material-symbols-outlined" fill="white" font-size="16" text-anchor="middle" x="16"
                        y="38">
                        cloud
                    </text>
                    <path d="M16 48 L16 54" fill="none" stroke="#0061a4" stroke-width="2"></path>
                    <circle cx="16" cy="54" fill="white" r="3" stroke="#0061a4" stroke-width="2"></circle>
                </g>
                <!-- 27° Marker -->
                <g transform="translate(234, 356)">
                    <rect fill="#1a1c1c" height="48" rx="16" width="32"></rect>
                    <text fill="white" font-size="10" font-weight="700" text-anchor="middle" x="16" y="18">
                        27°
                    </text>
                    <text class="material-symbols-outlined" fill="white" font-size="16" text-anchor="middle" x="16"
                        y="38">
                        rainy
                    </text>
                    <path d="M16 48 L16 54" fill="none" stroke="#0061a4" stroke-width="2"></path>
                    <circle cx="16" cy="54" fill="white" r="3" stroke="#0061a4" stroke-width="2"></circle>
                </g>
                <!-- Destination Pin 25° -->
                <g transform="translate(294, 196)">
                    <rect fill="#1a1c1c" height="48" rx="16" width="32"></rect>
                    <text fill="white" font-size="10" font-weight="700" text-anchor="middle" x="16" y="18">
                        25°
                    </text>
                    <text class="material-symbols-outlined" fill="white" font-size="16" text-anchor="middle" x="16"
                        y="38">
                        thunderstorm
                    </text>
                    <path d="M16 48 L16 54" fill="none" stroke="#0061a4" stroke-width="2"></path>
                    <circle cx="16" cy="54" fill="white" r="3" stroke="#0061a4" stroke-width="2"></circle>
                </g>
                <g transform="translate(310, 250)">
                    <path d="M0 -14 C-4 -14 -7 -11 -7 -7 C-7 -2 0 6 0 6 C0 6 7 -2 7 -7 C7 -11 4 -14 0 -14 Z" fill="#0061a4">
                    </path>
                    <circle cx="0" cy="-7" fill="white" r="2.5"></circle>
                </g>
            </svg>
        </div> --}}
        <div id="map" class="absolute inset-0">
        </div>
        <div id="weather-markers" class="absolute inset-0 z-30 pointer-events-none">

            <!-- Marker 1 -->
            <div id="weather-marker-1" class="weather-marker hidden">

                <div class="weather-marker-card">

                    <span id="marker-temp-1" class="text-[14px] font-bold leading-none">
                        27°
                    </span>

                    <span id="marker-time-1" class="text-[8px] leading-none">
                        12.02
                    </span>

                    <span id="marker-icon-1" class="material-symbols-outlined text-[18px] leading-none">
                        cloudy
                    </span>

                </div>

                <div class="weather-marker-stem"></div>

            </div>

            <!-- Marker 2 -->
            <div id="weather-marker-2" class="weather-marker hidden">

                <div class="weather-marker-card">

                    <span id="marker-temp-2" class="text-[14px] font-bold leading-none">
                    </span>

                    <span id="marker-time-2" class="text-[8px] leading-none">
                    </span>

                    <span id="marker-icon-2" class="material-symbols-outlined text-[18px] leading-none">
                    </span>

                </div>

                <div class="weather-marker-stem"></div>

            </div>

            <!-- Marker 3 -->
            <div id="weather-marker-3" class="weather-marker hidden">

                <div class="weather-marker-card">

                    <span id="marker-temp-3" class="text-[14px] font-bold leading-none">
                    </span>

                    <span id="marker-time-3" class="text-[8px] leading-none">
                    </span>

                    <span id="marker-icon-3" class="material-symbols-outlined text-[18px] leading-none">
                    </span>

                </div>

                <div class="weather-marker-stem"></div>

            </div>

        </div>
        </div>
        <!-- Search UI Floating (Lowered slightly as header is gone) -->
        <div class="fixed top-8 left-4 right-4 z-40 space-y-3">
            <!-- Search Bar Container -->
            <div class="bg-surface rounded-xl shadow-lg p-3 space-y-2 border border-outline-variant">
                <div class="flex items-center gap-3 px-1">
                    <span class="material-symbols-outlined text-secondary text-[20px]"
                        style="font-variation-settings: &quot;FILL&quot; 1">location_on</span>
                    <span class="font-body-sm text-on-surface-variant">Current Location</span>
                </div>
                <div class="h-[1px] bg-outline-variant mx-1"></div>
                <div class="flex items-center gap-3 px-1 pb-1">

                    <span class="material-symbols-outlined text-on-surface-variant text-[20px]">
                        search
                    </span>

                    <span id="destination-title" class="font-body-lg text-on-surface">

                        Loading destination...

                    </span>

                </div>
            </div>
            <!-- Rain Alert Banner -->
            <div id="rain-alert"
                class="bg-gradient-nav rounded-xl p-3 flex items-center gap-4 text-white shadow-md animate-pulse duration-[3000ms]">
                <div class="bg-white/20 p-2 rounded-lg">
                    <span id="rain-alert-icon" class="material-symbols-outlined text-[24px]">cloudy_snowing</span>
                </div>
                <div>
                    <p id="rain-alert-title" class="font-label-bold text-[13px] leading-tight">
                        Rain alert on route
                    </p>
                    <p id="rain-alert-subtitle" class="text-[11px] opacity-90">
                        Moderate rain expected in 4 minutes along your route
                    </p>
                </div>
            </div>
        </div>
        <!-- Draggable Bottom Sheet -->
        <div class="fixed bottom-0 left-0 right-0 z-[60] bg-surface rounded-t-[28px] shadow-[0_-8px_32px_rgba(0,0,0,0.12)] flex flex-col h-[71vh] sheet-half"
            id="bottom-sheet">
            <!-- Handle Area (Drag target) -->
            <div class="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing relative" id="sheet-handle">
                <div class="w-12 h-1.5 bg-surface-container-highest rounded-full"></div>

                <button id="closeToHome" type="button"
                    class="absolute top-3 right-4 w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest active:scale-90 transition-all">
                    <span class="material-symbols-outlined text-[20px]">close</span>
                </button>
            </div>
            <!-- Content Area -->
            <div class="px-6 pb-8 space-y-6 overflow-y-auto no-scrollbar">
                <!-- Header Info -->
                <div class="space-y-1">
                    <p class="text-on-surface-variant font-label-md">
                        Destination Information
                    </p>
                    <h2 id="destination-info-title" class="font-headline-lg text-headline-lg text-on-surface">
                        Loading...
                    </h2>
                    <div class="flex items-center gap-3 pt-1 text-[14px] font-medium">

                        <!-- ETA -->
                        <div class="flex items-center gap-1">

                            <span class="material-symbols-outlined text-[18px] text-on-surface-variant">
                                schedule
                            </span>

                            <span id="eta-value" class="text-on-surface">
                                --
                            </span>

                        </div>

                        <span class="text-on-surface-variant">•</span>

                        <!-- Distance -->
                        <div class="flex items-center gap-1">

                            <span class="material-symbols-outlined text-[18px] text-on-surface-variant">
                                route
                            </span>

                            <span id="distance-value" class="text-on-surface">
                                --
                            </span>

                        </div>

                        <span class="text-on-surface-variant">•</span>

                        <!-- Rain -->
                        <div class="flex items-center gap-1 text-primary">

<span
    id="rain-info-icon"
    class="material-symbols-outlined text-[18px] text-primary">

    rainy

</span>

<span
    id="rain-info"
    class="font-medium">

    Rain in 4 Minutes

</span>

                        </div>

                    </div>
                </div>
                <button id="startNavigation"
                    class="w-full h-16 rounded-full bg-gradient-nav text-white font-headline-md flex items-center justify-center gap-3 shadow-lg hover:shadow-xl active:scale-95 transition-all">
                    <span>Start Navigation</span>
                    <span class="material-symbols-outlined">near_me</span>
                </button>
                <!-- Weather Forecast Table -->
                <div class="bg-surface-container-low rounded-2xl overflow-hidden mt-2">
                    <div class="bg-surface-container-high/50 px-4 py-3 text-center text-on-surface-variant font-label-md">
                        Weather On Your Route
                    </div>
                    <div class="divide-y divide-surface-container-high/50">
                        <div class="flex items-center justify-between px-5 py-3">

                            <span id="weather-time-1" class="font-body-sm font-medium text-on-surface">

                                12.00 WIB

                            </span>

                            <div class="flex items-center gap-3 w-20 justify-end">

                                <span id="weather-icon-1" class="material-symbols-outlined text-orange-400 text-[20px]">

                                    wb_sunny

                                </span>

                                <span id="weather-temp-1" class="font-body-sm text-on-surface">

                                    30°/--

                                </span>

                            </div>

                        </div>
                        <div class="flex items-center justify-between px-5 py-3">

                            <span id="weather-time-2" class="font-body-sm font-medium text-on-surface">

                                --.-- WIB

                            </span>

                            <div class="flex items-center gap-3 w-20 justify-end">

                                <span id="weather-icon-2" class="material-symbols-outlined text-orange-400 text-[20px]">

                                    wb_sunny

                                </span>

                                <span id="weather-temp-2" class="font-body-sm text-on-surface">

                                    --°/--%

                                </span>

                            </div>

                        </div>
                        <div class="flex items-center justify-between px-5 py-3">
                            <span id="weather-time-3" class="font-body-sm font-medium text-on-surface">--.-- WIB</span>
                            <div class="flex items-center gap-3 w-20 justify-end">
                                <span id="weather-icon-3"
                                    class="material-symbols-outlined text-primary text-[20px]">rainy</span>
                                <span id="weather-temp-3" class="font-body-sm text-on-surface">--°/--%</span>
                            </div>
                        </div>
                        <!-- Extra rows for "Expanded" view simulation -->
                        <div class="flex items-center justify-between px-5 py-3">
                            <span id="weather-time-4" class="font-body-sm font-medium text-on-surface">--.-- WIB</span>
                            <div class="flex items-center gap-3 w-20 justify-end">
                                <span id="weather-icon-4"
                                    class="material-symbols-outlined text-primary text-[20px]">rainy</span>
                                <span id="weather-temp-4" class="font-body-sm text-on-surface">--°/--%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        @push('scripts')
            <script>
                const navigationRouteUrl = "{{ route('navigation.route') }}";
                const homeUrl = "{{ route('home') }}";
            </script>

            <script src="{{ asset('assets/js/destination.js') }}"></script>
        @endpush
    </body>

@endsection