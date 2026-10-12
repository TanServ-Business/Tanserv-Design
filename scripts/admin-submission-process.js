/* Live-aligned Submission Process tabs and client-admin review threshold. */
(() => {
  'use strict';
  const page = window.IneburaAdminPage;
  if (page?.module !== 'submission-process' || !['push-settings', 'review-rules'].includes(page.view)) return;

  const body = document.querySelector('.adminRuntimePage[data-admin-module="submission-process"] .adminWorkspaceBody');
  if (!body) return;

  if (page.view === 'push-settings') {
    body.innerHTML = `
      <section class="adminSubmissionEmail" aria-label="Push Email Settings">
        <div class="adminSubmissionEmailCard adminSubmissionFailover">
          <strong>Failover Email to ar.services@inebura.com <span>ON</span></strong>
          <p>If none of your own sender mailboxes can send a submission email, it goes out from ar.services@inebura.com instead.</p>
          <p>This applies to the whole tenant. To change it, go to Admin → Email Setup → Communication Setup.</p>
        </div>
        <div class="adminSubmissionEmailCard">
          <h2>EMAIL CONFIGURATION</h2>
          <label class="adminSubmissionEmailField" for="adminSubmissionSender">SEND FROM <abbr title="Required">*</abbr></label>
          <select id="adminSubmissionSender" aria-required="true"><option value="system.uat@tanserv.com">system.uat@tanserv.com</option></select>
        </div>
        <div class="adminSubmissionEmailCard">
          <h2>INCLUDE CONTACTS IN EMAIL</h2>
          <p class="adminSubmissionEmailLabel">SEND TO</p>
          <div class="adminSubmissionEmailContacts">
            <label><input type="checkbox" value="KAM" /><span>KAM</span></label>
            <label><input type="checkbox" value="KAS" /><span>KAS</span></label>
            <label><input type="checkbox" value="Manager" /><span>Manager</span></label>
          </div>
        </div>
        <footer><p id="adminSubmissionEmailMessage" role="status" aria-live="polite"></p><button class="adminPrimary" type="button" id="adminSubmissionEmailSave">Submit</button></footer>
      </section>`;
    const previewStorage = window.IneburaAdminPreviewStorage;
    let saved = {};
    try { saved = JSON.parse(previewStorage?.getItem('submissionPushEmail:v1') || '{}'); } catch (_) { /* Retain reference defaults. */ }
    body.querySelectorAll('.adminSubmissionEmailContacts input').forEach(input => { input.checked = Array.isArray(saved.contacts) && saved.contacts.includes(input.value); });
    document.getElementById('adminSubmissionEmailSave').addEventListener('click', () => {
      const contacts = [...body.querySelectorAll('.adminSubmissionEmailContacts input:checked')].map(input => input.value);
      previewStorage?.setItem('submissionPushEmail:v1', JSON.stringify({ sender: 'system.uat@tanserv.com', contacts }));
      document.getElementById('adminSubmissionEmailMessage').textContent = 'Push email settings saved in this preview.';
    });
    return;
  }

  const journey = window.SubmissionJourney;
  if (!journey) return;

  body.innerHTML = `
    <section class="adminReviewRules" aria-labelledby="adminReviewRulesTitle">
      <header class="adminReviewRulesHeader">
        <div>
          <h2 id="adminReviewRulesTitle">Review Rules</h2>
          <p>Choose when a pending invoice appears in Needs Review.</p>
        </div>
      </header>
      <div class="adminReviewRulesContent">
        <label class="adminReviewRulesField" for="adminReviewDays">
          <span>Review after <abbr title="Required">*</abbr></span>
          <span class="adminReviewRulesInput"><input id="adminReviewDays" type="number" min="1" max="365" step="1" required inputmode="numeric" aria-describedby="adminReviewDaysHelp" /><span>calendar days</span></span>
          <small id="adminReviewDaysHelp">Counted from the invoice date. Applies to all customers in this client.</small>
        </label>
        <div class="adminReviewRulesNote" aria-label="How review works">
          <h3>How review works</h3>
          <ul>
            <li>Pending invoices that reach this age appear in Needs Review. A missing document alone does not create an issue.</li>
            <li>If review is deferred, it returns on the chosen date even when the blocker or affected invoices change.</li>
            <li>Invoices recorded as submitted manually are excluded from the next automatic submission run.</li>
          </ul>
        </div>
      </div>
      <footer class="adminReviewRulesFooter">
        <p id="adminReviewRulesMessage" role="status" aria-live="polite"></p>
        <button class="adminPrimary" id="adminReviewRulesSave" type="button">Save Changes</button>
      </footer>
    </section>`;

  const input = document.getElementById('adminReviewDays');
  const message = document.getElementById('adminReviewRulesMessage');
  input.value = journey.readReviewDays(localStorage);
  document.getElementById('adminReviewRulesSave').addEventListener('click', () => {
    message.textContent = '';
    message.classList.remove('is-error');
    if (!input.checkValidity()) {
      input.reportValidity();
      return;
    }
    try {
      const days = journey.saveReviewDays(localStorage, input.value);
      message.textContent = `Saved. Pending invoices will appear in Needs Review after ${days} calendar ${days === 1 ? 'day' : 'days'} from the invoice date.`;
    } catch (error) {
      message.classList.add('is-error');
      message.textContent = error.message || 'The review rule could not be saved.';
    }
  });
})();
