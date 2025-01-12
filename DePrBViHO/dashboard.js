document.addEventListener('DOMContentLoaded', () => {
    const filteredCountWeekEl = document.getElementById('filteredCountWeek');
    const clickedCountWeekEl = document.getElementById('clickedCountWeek');
    const contentChartEl = document.getElementById('contentChart').getContext('2d');
    const emailConfigForm = document.getElementById('emailConfigForm');
    const statusMessage = document.getElementById('statusMessage');

    // Load weekly data and monthly data for the chart
    chrome.storage.local.get(['filteredCount', 'clickedCount', 'monthlyData'], (result) => {
        filteredCountWeekEl.textContent = result.filteredCount || 0;
        clickedCountWeekEl.textContent = result.clickedCount || 0;

        // Monthly chart data setup
        const monthlyData = result.monthlyData || [];
        const labels = Array.from({ length: 4 }, (_, i) => `Tuần ${i + 1}`);
        const filteredCounts = monthlyData.map(data => data.filtered || 0);
        const clickedCounts = monthlyData.map(data => data.clicked || 0);

        // Destroy any existing chart instance to avoid duplication
        if (window.contentChart && typeof window.contentChart.destroy === 'function') {
            window.contentChart.destroy();
        }

        // Create a new chart instance with custom styles
        window.contentChart = new Chart(contentChartEl, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Số bình luận đã sàng lọc',
                        data: filteredCounts,
                        borderColor: 'rgba(52, 152, 219, 1)',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(52, 152, 219, 1)',
                        pointRadius: 5

                    },
                    {
                        label: 'Số bình luận xấu đã bấm xem',
                        data: clickedCounts,
                        borderColor: 'rgba(231, 76, 60, 1)',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(231, 76, 60, 1)',
                        pointRadius: 5
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#333',
                            usePointStyle: true,
                            pointStyle: 'circle',
                        }
                    },
                    title: {
                        display: true,
                        text: 'Thống kê số liệu bình luận trong 1 tháng',
                        color: '#333',
                        font: {
                            size: 18
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#333'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#333'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                }
            }
        });
    });

    // Load saved email configuration
    chrome.storage.local.get(['recipientEmail'], (result) => {
        document.getElementById('recipientEmail').value = result.recipientEmail || '';
    });

    // Save email configuration on form submit
    emailConfigForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const recipientEmail = document.getElementById('recipientEmail').value;
        chrome.storage.local.set({recipientEmail}, () => {
            statusMessage.textContent = "Email settings saved successfully!";
            setTimeout(() => (statusMessage.textContent = ""), 3000);
        });
    });
});
