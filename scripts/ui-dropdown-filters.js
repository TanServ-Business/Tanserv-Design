/* Shared disclosure behavior for the existing UI Elements filter pattern.
 * App-specific handlers continue to own the filtering and displayed labels.
 * Add data-filter-multiple for checkbox menus that stay open after selection.
 * Add data-ui-filter to let this helper manage the displayed selection badge.
 */
(function () {
  "use strict";
  if (window.IneburaDropdownFilters) return;

  const dropdownSelector = "details.filterDropdown, details.adminFilterDropdown";
  const openDropdownSelector = "details.filterDropdown[open], details.adminFilterDropdown[open]";
  const isMultiple = (dropdown) => dropdown.hasAttribute("data-filter-multiple") ||
    !!dropdown.querySelector('input[type="checkbox"], [aria-multiselectable="true"]');
  const isManaged = (dropdown) => dropdown.hasAttribute("data-ui-filter");

  function close(dropdown, restoreFocus) {
    dropdown.removeAttribute("open");
    if (restoreFocus) dropdown.querySelector("summary")?.focus();
  }

  function sync(dropdown) {
    if (!isManaged(dropdown)) return;
    const badge = dropdown.querySelector(".filterBadge");
    if (!badge || !isMultiple(dropdown)) return;
    const selected = Array.from(dropdown.querySelectorAll('input[type="checkbox"]:checked'));
    badge.textContent = selected.length ? selected.map((input) => input.value).join(", ") : "All";
  }

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const current = event.target.closest(dropdownSelector);
    document.querySelectorAll(openDropdownSelector).forEach((dropdown) => {
      if (!dropdown.contains(event.target)) close(dropdown, false);
    });
    if (!current || isMultiple(current)) return;
    const item = event.target.closest("[data-filter-value]");
    if (!item || !current.contains(item) || item.matches(":disabled, [aria-disabled=\"true\"]")) return;
    if (isManaged(current)) {
      const badge = current.querySelector(".filterBadge");
      if (badge) badge.textContent = item.textContent.trim() || item.getAttribute("data-filter-value") || "All";
    }
    close(current, true);
  });

  document.addEventListener("change", (event) => {
    if (!(event.target instanceof Element)) return;
    const dropdown = event.target.closest(dropdownSelector);
    if (dropdown) sync(dropdown);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !(event.target instanceof Element)) return;
    const dropdown = event.target.closest(dropdownSelector);
    if (dropdown?.hasAttribute("open")) {
      close(dropdown, true);
      event.preventDefault();
    }
  });

  window.IneburaDropdownFilters = { sync };
})();
