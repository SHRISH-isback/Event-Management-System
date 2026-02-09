import { useEffect, useRef, useState } from "react";

const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"; // Test key

export default function ReCaptcha({ onVerify, onExpire, theme = "light", size = "normal" }) {
    const captchaRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [widgetId, setWidgetId] = useState(null);

    useEffect(() => {
        const loadRecaptcha = () => {
            if (window.grecaptcha) {
                setIsLoaded(true);
                return;
            }

            const script = document.createElement("script");
            script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
            script.async = true;
            script.defer = true;
            script.onload = () => setIsLoaded(true);
            document.head.appendChild(script);
        };

        loadRecaptcha();
    }, []);

    useEffect(() => {
        if (isLoaded && captchaRef.current && !widgetId) {
            try {
                const id = window.grecaptcha.render(captchaRef.current, {
                    sitekey: RECAPTCHA_SITE_KEY,
                    theme: theme,
                    size: size,
                    callback: (token) => {
                        if (onVerify) onVerify(token);
                    },
                    "expired-callback": () => {
                        if (onExpire) onExpire();
                    },
                });
                setWidgetId(id);
            } catch (error) {
                console.error("Error rendering reCAPTCHA:", error);
            }
        }
    }, [isLoaded, theme, size, onVerify, onExpire, widgetId]);

    const reset = () => {
        if (window.grecaptcha && widgetId !== null) {
            window.grecaptcha.reset(widgetId);
        }
    };

    useEffect(() => {
        if (captchaRef.current) {
            captchaRef.current.reset = reset;
        }
    }, [widgetId]);

    return (
        <div className="recaptcha-container" style={{ marginBottom: "15px" }}>
            <div ref={captchaRef}></div>
        </div>
    );
}

export function useRecaptcha() {
    const [token, setToken] = useState(null);
    const [isVerified, setIsVerified] = useState(false);
    const captchaRef = useRef(null);

    const handleVerify = (captchaToken) => {
        setToken(captchaToken);
        setIsVerified(true);
    };

    const handleExpire = () => {
        setToken(null);
        setIsVerified(false);
    };

    const reset = () => {
        if (captchaRef.current && captchaRef.current.reset) {
            captchaRef.current.reset();
        }
        setToken(null);
        setIsVerified(false);
    };

    return {
        token,
        isVerified,
        captchaRef,
        handleVerify,
        handleExpire,
        reset,
    };
}
