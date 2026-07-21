@extends('layouts.app')

@section('google-maps')
@endsection

@section('title', 'Navigation - Weather Maps')

@section('content')

    <div
        class="relative w-full h-full bg-white overflow-hidden flex flex-col">
        <!-- Background Map Layer -->
        <div id="map" class="absolute inset-0 z-0"></div>
        <button
    id="relocate-btn"
    class="hidden absolute bottom-52 right-4 z-30 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center">

    <span class="material-symbols-outlined text-primary">

        my_location

    </span>

</button>

        {{-- <!-- Route Overlay -->
        <svg class="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 430 932">

            <path id="main-path" d="M215 900 V600 L100 600 V300 L300 300" fill="none" stroke="transparent">
            </path>

            <path class="route-line opacity-20" d="M215 900 V600 L100 600 V300 L300 300" fill="none" stroke="#ff0099"
                stroke-width="20" stroke-linecap="round">
            </path>

            <path class="route-line" d="M215 900 V600 L100 600 V300 L300 300" fill="none" stroke="#ff0099"
                stroke-width="14" stroke-linecap="round">
            </path>

            <g id="user-marker">

                <circle cx="0" cy="0" r="12" fill="#ff0099">
                </circle>

                <circle cx="0" cy="0" r="5" fill="white">
                </circle>

                <animateMotion dur="40s" repeatCount="indefinite">

                    <mpath href="#main-path"></mpath>

                </animateMotion>

            </g>

        </svg> --}}
        <!-- Instruction Overlay Card -->
        <div class="relative z-30 px-4 mt-6 flex flex-col gap-3">
            <div
                class="bg-white rounded-[24px] p-5 shadow-xl flex flex-col gap-4 border border-outline-variant/30 w-full rounded-b-[24px]">
                <div class="flex items-start gap-4">
                    <!-- Icon container with blue-to-green gradient -->
                    <div
                        class="w-14 h-14 bg-gradient-to-tr from-[#007AFF] to-[#34C759] rounded-2xl flex items-center justify-center text-white shrink-0">
                        <span class="material-symbols-outlined !text-4xl"
                            style="font-variation-settings: &quot;wght&quot; 700">turn_slight_left</span>
                    </div>
                    <div class="flex-1">
                        <p id="instruction-distance" class="text-on-surface-variant font-label-md">In --</p>
                        <h2 id="instruction-text" class="font-headline-lg text-headline-lg text-on-surface leading-tight mt-1">
                            Turn --<span class="text-primary">XY</span>
                        </h2>
                    </div>
                    <button id="closeToDestination"
                        class="text-on-surface-variant/40 hover:text-on-surface-variant transition-colors">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div class="flex items-center gap-2 pt-3 border-t border-outline-variant/20">
                    <span class="material-symbols-outlined text-primary text-sm">navigation</span>
                    <p id="next-instruction" class="text-on-surface-variant font-body-sm">
                        Then continue --
                    </p>
                </div>
            </div>
            <!-- Rain Alert Notification -->
            <div class="relative bg-gradient-to-r from-[#007AFF] to-[#34C759] rounded-full py-2.5 px-4 shadow-lg flex items-center justify-between border border-transparent w-full cursor-pointer ml-auto"
                id="rain-alert" onclick="toggleAlert()">
                <div class="flex items-center gap-3 overflow-hidden whitespace-nowrap" id="alert-content">
                    <div class="text-white flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined !text-xl" id="alert-icon">cloudy_snowing</span>
                    </div>
                    <span id="alert-text" class="font-label-bold text-white">Weather Alert On Your Route</span>
                </div>
                <button class="text-white/70 hover:text-white transition-colors alert-close"
                    onclick="
              event.stopPropagation();
              toggleAlert();
            ">
                    <span class="material-symbols-outlined !text-sm">close</span>
                </button>
            </div>
        </div>
        <!-- Floating Action Buttons -->
        <!-- Bottom Sheet (ETA Card) -->
        <div class="fixed bottom-0 left-0 right-0 z-40 w-full flex flex-col gap-2 px-4 pb-4">
            <!-- Heatmap Legend Card (Full width matching ETA card) -->
            <div class="bg-white rounded-xl p-3 border border-outline-variant/30 shadow-lg w-full flex items-center justify-between overflow-hidden relative z-50 mb-2"
                id="legend-panel"
                onclick="
            if (this.classList.contains('legend-collapsed')) {
              document.getElementById('legend-toggle').click();
            }
          ">
                <div class="flex flex-col flex-1" id="legend-full-content">
                    <div class="flex items-center mb-1">
                        <span
                            class="font-label-bold text-on-surface-variant uppercase tracking-widest text-[10px]">Legend</span>
                    </div>
                    <div
                        class="h-2 w-full rounded-full bg-gradient-to-r from-primary-container via-secondary-fixed to-error mb-1">
                    </div>
                    <div class="flex justify-between text-[9px] text-on-surface-variant/80 font-medium px-1">
                        <span>Sangat Ringan</span>
                        <span>Ringan</span>
                        <span>Sedang</span>
                        <span>Lebat</span>
                        <span>Ekstrem</span>
                    </div>
                </div>
                <!-- Minimized vertical view (hidden by default) -->
                <div class="hidden flex-col items-center justify-center h-full px-1" id="legend-min-content">
                    <span
                        class="legend-text-vertical font-label-bold text-on-surface-variant uppercase tracking-widest text-[10px]">Legend</span>
                </div>
                <!-- Vertical Drag Handle Bar -->
                <div class="ml-3 flex items-center justify-center cursor-pointer h-8 w-6 group" id="legend-toggle">
                    <div
                        class="w-1 h-6 bg-surface-container-highest rounded-full group-hover:bg-outline-variant transition-colors">
                    </div>
                </div>
            </div>
            <!-- Main Stats Content (ETA Card) -->
            <div id="eta-panel"
                class="bg-white pt-0 rounded-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border border-outline-variant/20 p-6">
                <div id="eta-toggle" class="flex justify-center py-2 cursor-pointer">

                    <div class="w-12 h-1.5 rounded-full bg-surface-container-highest">
                    </div>

                </div>
                <div id="eta-content">
                    <div class="flex items-center justify-between">
                        <div class="flex flex-col items-center flex-1">
                            <span id="nav-eta" class="font-display-time text-on-surface">--</span>
                            <span class="font-label-md text-on-surface-variant">Min</span>
                        </div>
                        <div class="h-10 w-[1px] bg-outline-variant/30"></div>
                        <div class="flex flex-col items-center flex-1">
                            <span id="nav-distance" class="font-display-time text-on-surface">-.-</span>
                            <span class="font-label-md text-on-surface-variant">km</span>
                        </div>
                        <div class="h-10 w-[1px] bg-outline-variant/30"></div>
                        <div class="flex flex-col items-center flex-1">
                            <span id="nav-speed" class="font-display-time text-on-surface">--</span>
                            <span class="font-label-md text-on-surface-variant">km/h</span>
                        </div>
                        <div class="h-10 w-[1px] bg-outline-variant/30"></div>
                        <div class="flex flex-col items-center flex-1">
                            <span id="nav-arrival-time" class="font-display-time text-primary">--:--</span>
                            <span class="font-label-md text-primary font-bold">WIB</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @push('scripts')
        <script>
            const destinationPreviewUrl = "{{ route('destination.preview') }}";
        </script>

        <script src="{{ asset('assets/js/navigation.js') }}"></script>
    @endpush

@endsection