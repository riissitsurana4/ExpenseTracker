'use client';
import { useEffect } from "react";

export default function DashboardNavbarClient() {
  useEffect(() => {
    let listeners = [];
    let intervalId = setInterval(() => {
      // Wait for Bootstrap JS to be loaded and navbar to be in DOM
      const navbarCollapse = document.getElementById("dashboardNavbar");
      const navLinks = document.querySelectorAll("#dashboardNavbar .nav-link");
      if (window.bootstrap && window.bootstrap.Collapse && navbarCollapse && navLinks.length) {
        console.log("Bootstrap and navbar ready, attaching collapse listeners");
        navLinks.forEach(link => {
          const handler = () => {
            if (navbarCollapse.classList.contains("show")) {
              const collapse = new window.bootstrap.Collapse(navbarCollapse, { toggle: false });
              collapse.hide();
            }
          };
          link.addEventListener("click", handler);
          listeners.push({ link, handler });
        });
        clearInterval(intervalId);
      }
    }, 100);

    return () => {
      clearInterval(intervalId);
      listeners.forEach(({ link, handler }) => {
        link.removeEventListener("click", handler);
      });
    };
  }, []);
  return null;
}