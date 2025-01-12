// Load EmailJS script
importScripts('email.min.js');
const KEY='xxxxx';
const service = "xxxx";
const template = "xxxxx";
// Initialize EmailJS with your User ID
emailjs.init(KEY);

// Function to send the weekly email report
function sendWeeklyEmail() {
    chrome.storage.local.get(['filteredCount', 'clickedCount', 'monthlyData', 'recipientEmail'], (result) => {
        const filteredCount = result.filteredCount || 0;
        const clickedCount = result.clickedCount || 0;
        const recipientEmail = result.recipientEmail;

        if (!recipientEmail) {
            console.error("Email configuration is missing. Please set it up in the dashboard.");
            return;
        }

        // Configure and send email with EmailJS
        emailjs.send(service, template, {
            recipient_email: recipientEmail,
            filtered_count: filteredCount,
            clicked_count: clickedCount,
        }).then((response) => {
            console.log("Weekly report email sent successfully:", response.status, response.text);
            
            // Reset weekly data
            const monthlyData = result.monthlyData || [];
            monthlyData.push({ filtered: filteredCount, clicked: clickedCount });
            if (monthlyData.length > 4) {
                monthlyData.shift();
            }
            chrome.storage.local.set({ monthlyData, filteredCount: 0, clickedCount: 0 });
        }).catch((error) => {
            console.error("Error sending email:", error);
        });
    });
}

// Set weekly alarm
chrome.alarms.create('weeklyReport', { periodInMinutes: 10080 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'weeklyReport') {
        sendWeeklyEmail();
    }
});
