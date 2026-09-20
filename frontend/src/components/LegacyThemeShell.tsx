'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export default function LegacyThemeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Check if current route is a standalone clinical application
  const isAgentApp = 
    pathname?.includes('/orchestrator-agent') ||
    pathname?.includes('/symptom-triage-agent') ||
    pathname?.includes('/medical-scan-agent') ||
    pathname?.includes('/records') ||
    pathname?.includes('/vibrant') ||
    pathname?.includes('/interactive-body');

  // Standalone Auth & Session Management pages
  const isAuthApp =
    pathname?.includes('/login') ||
    pathname?.includes('/signup') ||
    pathname?.includes('/verify-mfa') ||
    pathname?.includes('/security') ||
    pathname?.includes('/sessions') ||
    pathname?.includes('/confirm-account') ||
    pathname?.includes('/forgot-password') ||
    pathname?.includes('/reset-password');

  const isNoLoaderPage = 
    pathname?.includes('/legal-notice') ||
    pathname?.includes('/privacy-policy') ||
    pathname?.includes('/cookie-policy');

  if (isAgentApp) {
    return (
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#f8fafc' }}>
        {children}
      </div>
    );
  }

  if (isAuthApp) {
    return (
      <div style={{ width: '100%', minHeight: '100vh', background: '#f8fafc' }}>
        {children}
      </div>
    );
  }


  return (
    <>

      <div className="grid wrapper">
        <div></div><div></div><div></div><div></div>
        <div></div><div></div><div></div><div></div>
        <div></div><div></div><div></div><div></div>
      </div>

      <div id="mouse" className="d-md-nonexx" suppressHydrationWarning><div><span className="f-izmir t-parrafo"></span></div></div>

      {/* Direct Bypass Button: Launch Rural AI Healthcare */}
      <div 
        style={{
          position: 'fixed',
          top: '18px',
          right: '24px',
          zIndex: 9999999,
          pointerEvents: 'auto'
        }}
      >
        <a
          href="/orchestrator-agent"
          data-no-swup="true"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 22px',
            borderRadius: '25px',
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            color: '#ffffff',
            fontSize: '13.5px',
            fontWeight: 800,
            textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(5, 150, 105, 0.45)',
            border: '1.5px solid rgba(255, 255, 255, 0.4)',
            cursor: 'pointer',
            letterSpacing: '-0.01em',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        >
          <span>🏥 Enter Rural AI Healthcare</span>
          <span style={{ fontSize: '15px' }}>→</span>
        </a>
      </div>

      {/* Global Luxury Header */}
      <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `<header>
		<div class="header wrapper">
			<div class="header__logo logo c-white" style="${isNoLoaderPage ? 'display: none !important;' : ''} cursor: pointer;" onclick="window.location.href='/orchestrator-agent'" data-url="/orchestrator-agent">
				<div class="logo__normal link">Synapse</div>
				<div class="logo__group">
					<div class="logo__is">O</div>
					<div class="logo__boring">S<div class="reg">®</div></div>
				</div>
			</div>
			<a class="header__btn btn btn--menu btn--header btn--bg f-edit t-parrafo-l d-none">
				<span><span>Menu</span></span>
			</a>
			<a class="header__footer__btn btn--header btn btn--bg f-edit t-parrafo-l d-none">
				<span><span><span class="number f-edit t-italic t-parrafo-l"></span><span class="circle"></span><span class="name f-edit t-parrafo-l"></span></span></span>
			</a>
		</div>
		<div class="header__menu c-black d-none">
			<div class="header__menu__bg"></div>
			<ul id="menu-principal" class="header__menu__nav-site f-izmir t-titulo-l t-upper">
				<li class="link menu-item"><a href="/" data-no-swup="true">Home</a></li>
				<li class="link menu-item"><a href="/orchestrator-agent" data-no-swup="true">Rural AI Healthcare</a></li>
				<li class="link menu-item" style="margin-left: 2rem; font-size: 0.8em;"><a href="/orchestrator-agent?tab=overview" data-no-swup="true" style="opacity: 0.8;">- Clinical Command Center</a></li>
				<li class="link menu-item" style="margin-left: 2rem; font-size: 0.8em;"><a href="/orchestrator-agent?tab=whatsapp" data-no-swup="true" style="opacity: 0.8;">- WhatsApp AI Bot</a></li>
				<li class="link menu-item" style="margin-left: 2rem; font-size: 0.8em;"><a href="/orchestrator-agent?tab=rural" data-no-swup="true" style="opacity: 0.8;">- Rural Health Hub & 2G SMS</a></li>
				<li class="link menu-item" style="margin-left: 2rem; font-size: 0.8em;"><a href="/orchestrator-agent?tab=records" data-no-swup="true" style="color: #10b981; opacity: 0.9;">- ABHA & Records</a></li>
			</ul>
			<div class="header__menu__content">
				<div class="header__menu__media expand_mouse follow__wrap" data-text="Explore" data-url="/orchestrator-agent">
					<a href="/orchestrator-agent" data-no-swup="true" class="btn btn--circle follow__mouse--md f-izmir t-parrafo-l d-none d-md-flex"></a>
					<div class="header__menu__media__title f-medium t-titulo-xl t-upper" style="opacity: 0; position: absolute; pointer-events: none;">RURAL AI HEALTHCARE</div>
          <div class="media header__menu__media__image noAnimate no-general-anim noAspect" data-delay="" style="transform: scale(1.1); transform-origin: left center;"> 
            <div class="media__wrap-source image" style="border-radius: 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.12);">
              <img class="media__source w-100" src="/images/medical/abha_card.png" alt="ABHA Health Identification Card" style="display: block; border-radius: 16px; object-fit: contain;">
            </div>
          </div>
				</div>
				<nav class="header__menu__nav-single">
					<h5 class="header__menu__nav-single__title f-izmir t-titulo t-upper">Rural AI Healthcare Stack</h5>
					<div class="header__menu__nav-single__proyectos">
						<div class="header__menu__nav-single__proyectos__item">
							<a href="/orchestrator-agent?tab=overview" data-no-swup="true">
								<div class="num-title t-titulo-l t-upper"><span class="num f-edit t-parrafo-xl t-normal">(1)</span><span class="title">Clinical Command Center</span></div>
								<div class="place f-edit t-parrafo-xl t-italic">Active</div>
							</a>
						</div>
						<div class="header__menu__nav-single__proyectos__item">
							<a href="/orchestrator-agent?tab=whatsapp" data-no-swup="true">
								<div class="num-title t-titulo-l t-upper"><span class="num f-edit t-parrafo-xl t-normal">(2)</span><span class="title">WhatsApp AI Bot</span></div>
								<div class="place f-edit t-parrafo-xl t-italic">Meta Cloud API</div>
							</a>
						</div>
						<div class="header__menu__nav-single__proyectos__item">
							<a href="/orchestrator-agent?tab=rural" data-no-swup="true">
								<div class="num-title t-titulo-l t-upper"><span class="num f-edit t-parrafo-xl t-normal">(3)</span><span class="title">Rural Health Hub</span></div>
								<div class="place f-edit t-parrafo-xl t-italic">Offline SMS / UIP</div>
							</a>
						</div>
						<div class="header__menu__nav-single__proyectos__item">
							<a href="/orchestrator-agent?tab=records" data-no-swup="true">
								<div class="num-title t-titulo-l t-upper"><span class="num f-edit t-parrafo-xl t-normal">(4)</span><span class="title">ABHA & Health Records</span></div>
								<div class="place f-edit t-parrafo-xl t-italic" style="color: #10b981; font-weight: 600; white-space: nowrap;">ABDM Verified</div>
							</a>
						</div>
					</div>
				</nav>
			</div>
			<a href="tel:hello@synapseos.com" class="header__menu__link-footer f-edit t-titulo link">hello@synapseos.com</a>
		</div>
	</header>` }} />

      {/* Smooth Wrapper for Marketing Homepage */}
      <div id="smooth-wrapper">
        <div id="smooth-content">
          {children}
        </div>
      </div>

      {/* Modals required by marketing scripts */}
      <div id="wrap-modals">
        <div className="modal modal--contact d-none" data-lenis-prevent="true">
          <div className="modal__bg"></div>
          <div className="modal__content bg-white">
            <a className="modal__close close"><span></span><span></span></a>
            <div className="modal__content__pretitle f-edit t-parrafo-l">(CONNECT)</div>
            <div className="modal__content__title t-upper f-regular t-titulo-xl t-center">Test the <br/>Live Platform</div>
          </div>
        </div>
        <div className="modal modal--media d-none" data-lenis-prevent="true">
          <div className="modal__bg"></div>
          <div className="modal__content">
            <a className="modal__close close close--white"><span></span><span></span></a>
            <div className="modal__video"></div>
          </div>
        </div>
      </div>
    </>
  );
}
