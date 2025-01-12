document.addEventListener('DOMContentLoaded', () => {
    const filteredCountWeekEl = document.getElementById('filteredCountWeek');
    const clickedCountWeekEl = document.getElementById('clickedCountWeek');
    const openDashboardButton = document.getElementById('openDashboard');

    // Lấy dữ liệu số liệu tuần hiện tại từ chrome.storage
    chrome.storage.local.get(['filteredCount', 'clickedCount'], (result) => {
        filteredCountWeekEl.textContent = result.filteredCount || 0;
        clickedCountWeekEl.textContent = result.clickedCount || 0;
    });

    // Mở dashboard.html khi bấm vào nút
    openDashboardButton.addEventListener('click', () => {
        // Lấy URL của extension và mở trang dashboard.html
        const dashboardUrl = chrome.runtime.getURL('dashboard.html');
        chrome.tabs.create({ url: dashboardUrl });
    });
});