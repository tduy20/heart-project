document.addEventListener("DOMContentLoaded", function () {
    // Biến để theo dõi chế độ xem hiện tại
    let currentViewMode = "single"; // "single" hoặc "all"
    let currentTask = 1; // Mặc định hiển thị Task 1

    // Khởi tạo các phần tử DOM
    const menuItems = document.querySelectorAll('.task-menu li');
    const viewAllBtn = document.getElementById('view-all');
    const mainTitle = document.getElementById('main-title');
    const chartsContainer = document.querySelector('.charts-container');
    const chartCards = document.querySelectorAll('.chart-card');

    // Hàm cập nhật UI dựa vào task được chọn
    function updateUI(taskId) {
        // Cập nhật trạng thái menu
        menuItems.forEach(item => {
            if (item.dataset.task === taskId.toString()) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Trong chế độ đơn, cập nhật tiêu đề và hiển thị biểu đồ
        if (currentViewMode === "single") {
            // Cập nhật tiêu đề chính
            const selectedTask = document.querySelector(`.task-menu li[data-task="${taskId}"]`);
            mainTitle.textContent = selectedTask.textContent;

            // Ẩn tất cả các biểu đồ và chỉ hiển thị biểu đồ được chọn
            chartCards.forEach(card => {
                if (card.id === `chart-container-${taskId}`) {
                    card.classList.add('active');
                } else {
                    card.classList.remove('active');
                }
            });
        }
    }

    // Hàm chuyển đổi giữa chế độ xem đơn biểu đồ và tất cả biểu đồ
    function toggleViewMode() {
        if (currentViewMode === "single") {
            // Chuyển sang chế độ xem tất cả
            currentViewMode = "all";
            viewAllBtn.textContent = "Xem biểu đồ đơn";
            mainTitle.textContent = "Tất cả biểu đồ phân tích bệnh tim";
            chartsContainer.classList.add('grid-view');
            chartCards.forEach(card => card.classList.add('active'));
        } else {
            // Chuyển về chế độ xem đơn
            currentViewMode = "single";
            viewAllBtn.textContent = "Xem tất cả biểu đồ";
            chartsContainer.classList.remove('grid-view');
            updateUI(currentTask);
        }
    }

    // Xử lý sự kiện click vào các mục menu
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const taskId = parseInt(this.dataset.task);
            currentTask = taskId;
            
            if (currentViewMode === "all") {
                toggleViewMode(); // Chuyển về chế độ đơn nếu đang ở chế độ xem tất cả
            } else {
                updateUI(taskId);
            }
        });
    });

    // Xử lý sự kiện click vào nút "Xem tất cả"
    viewAllBtn.addEventListener('click', toggleViewMode);

    // Tải dữ liệu và vẽ biểu đồ
    d3.csv("project_heart_disease.csv").then(data => {
        // === Chuẩn hóa dữ liệu cho Task 1: Phân bố bệnh tim theo nhóm tuổi ===
        const ageGroups = [
            { label: "<30", test: d => +d.Age < 30 },
            { label: "30-39", test: d => +d.Age >= 30 && +d.Age < 40 },
            { label: "40-49", test: d => +d.Age >= 40 && +d.Age < 50 },
            { label: "50-59", test: d => +d.Age >= 50 && +d.Age < 60 },
            { label: "60+", test: d => +d.Age >= 60 }
        ];
        const task1Data = {};
        ageGroups.forEach(g => task1Data[g.label] = { Yes: 0, No: 0 });
        data.forEach(row => {
            const group = ageGroups.find(g => g.test(row));
            const status = row["Heart Disease Status"];
            if (group && status) task1Data[group.label][status]++;
        });
        const task1Formatted = Object.entries(task1Data).map(([group, val]) => ({ 
            group, 
            Yes: val.Yes, 
            No: val.No,
            total: val.Yes + val.No 
        }));
        
        // Vẽ biểu đồ ban đầu với đầy đủ dữ liệu
        drawGroupedBarChart("#chart-task1", task1Formatted, "Nhóm tuổi", "Số lượng", {
            filterableGroups: ["Yes", "No"],
            sortable: true,
            chartId: 1  // Thêm chartId
        });
        
        // Thiết lập sự kiện filter
        setupChartFilters("#chart-task1", task1Formatted);
        
        // === Chuẩn hóa dữ liệu cho Task 2: Mối liên hệ giữa giới tính và bệnh tim ===



        // === Chuẩn hóa dữ liệu cho Task 3: Mối liên hệ giữa hút thuốc và bệnh tim ===

        // === Chuẩn hóa dữ liệu cho Task 4: Ảnh hưởng của vận động đến bệnh tim ===

        // === Task 5: Mức độ cholesterol giữa 2 nhóm bệnh tim ===
        drawBoxplot(data, "#chart-task5", 5);  // Thêm tham số 5 là chartId
        
        // === Chuẩn hóa dữ liệu cho Task 6: Tương quan giữa BMI và bệnh tim ===

    }).catch(error => {
        console.error("Lỗi khi tải dữ liệu:", error);
    });

    // Khởi tạo giao diện
    updateUI(currentTask);
});

// === HÀM CHUNG VẼ BIỂU ĐỒ CỘT CÓ TOOLTIP, LEGEND, LABEL ===
function drawGroupedBarChart(selector, data, xLabel, yLabel, options = {}) {
    const svg = d3.select(selector);
    
    // Xóa nội dung cũ nếu có
    svg.selectAll("*").remove();
    
    // Tăng margin.right để có thêm không gian cho legend
    const margin = { top: 40, right: 50, bottom: 60, left: 60 };
    const width = +svg.attr("width") - margin.left - margin.right;
    const height = +svg.attr("height") - margin.top - margin.bottom;

    const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const subgroups = options.filterableGroups || ["Yes", "No"];
    const colors = { Yes: "tomato", No: "steelblue" };
    const legendLabels = { Yes: "Có bệnh tim", No: "Không có bệnh tim" };

    // Tính giá trị max mới dựa trên dữ liệu đã lọc
    const yMax = d3.max(data, d => Math.max(d.Yes || 0, d.No || 0)) * 1.1;
    
    const x = d3.scaleBand().domain(data.map(d => d.group)).range([0, width]).padding(0.2);
    const xSub = d3.scaleBand().domain(subgroups).range([0, x.bandwidth()]).padding(0.05);
    const y = d3.scaleLinear().domain([0, yMax]).nice().range([height, 0]);

    // Trục với định dạng số nguyên cho trục y
    chart.append("g")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d => Math.round(d)));
        
    chart.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    // Nhãn trục với kiểu chữ và vị trí được cải thiện
    chart.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .text(`${xLabel}`);
        
    chart.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -45)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .text(`${yLabel} (số người)`);

    // Tooltip
    let tooltip = d3.select("body").select(".tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body").append("div").attr("class", "tooltip");
    }

    // Cột
    const bars = chart.append("g")
        .selectAll("g")
        .data(data)
        .enter()
        .append("g")
        .attr("transform", d => `translate(${x(d.group)},0)`);
        
    bars.selectAll("rect")
        .data(d => subgroups.map(key => ({ 
            key, 
            value: d[key] || 0, 
            group: d.group,
            // Đánh dấu nếu nhóm này bị lọc ra
            filtered: options.activeFilters && !options.activeFilters.includes(key)
        })))
        .enter()
        .append("rect")
        .attr("x", d => xSub(d.key))
        .attr("width", xSub.bandwidth())
        .attr("y", y(0))
        .attr("height", 0)
        .attr("fill", d => d.filtered ? "#eee" : colors[d.key]) // Màu xám cho cột bị lọc
        .attr("opacity", d => d.filtered ? 0.3 : 1) // Độ mờ cho cột bị lọc
        .on("mouseover", (event, d) => {
            if (!d.filtered && d.value > 0) {
                tooltip.style("opacity", 1)
                    .html(`<strong>${d.group}</strong><br>${legendLabels[d.key]}: ${d.value} người`)
                    .style("left", event.pageX + 10 + "px")
                    .style("top", event.pageY - 28 + "px");
            }
        })
        .on("mouseout", () => tooltip.style("opacity", 0))
        .transition()
        .duration(800)
        .attr("y", d => y(d.value))
        .attr("height", d => height - y(d.value));

    // Label trên đỉnh cột - chỉ hiển thị nếu không bị lọc và giá trị > 0
    chart.selectAll(".label")
        .data(data.flatMap(d => subgroups.map(key => ({
            group: d.group, 
            key, 
            value: d[key] || 0,
            // Đánh dấu nếu nhóm này bị lọc ra
            filtered: options.activeFilters && !options.activeFilters.includes(key)
        }))))
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => x(d.group) + xSub(d.key) + xSub.bandwidth() / 2)
        .attr("y", d => y(d.value) - 8)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .style("opacity", d => (d.filtered || d.value === 0) ? 0 : 1) // Ẩn label cho cột bị lọc
        .text(d => d.value);

    // Legend với chú thích chi tiết hơn
    const legend = svg.append("g").attr("transform", `translate(${width - 180}, 15)`);
    
    // Tiêu đề cho phần chú thích
    legend.append("text")
        .attr("x", 0)
        .attr("y", 8)
        .attr("font-weight", "bold")
        .text("Tình trạng bệnh tim:");
    
    subgroups.forEach((key, i) => {
        // Tạo legend cho từng nhóm với độ mờ phụ thuộc vào trạng thái lọc
        const isFiltered = options.activeFilters && !options.activeFilters.includes(key);
        
        legend.append("rect")
            .attr("x", 0)
            .attr("y", i * 20 + 10)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", colors[key])
            .attr("opacity", isFiltered ? 0.3 : 1);

        legend.append("text")
            .attr("x", 20)
            .attr("y", i * 20 + 22)
            .text(legendLabels[key])
            .attr("font-size", "14px")
            .attr("fill", isFiltered ? "#888" : "#333")
            .style("opacity", isFiltered ? 0.7 : 1);
    });
    
    if (options.chartId) {
        addChartCaption(selector, options.chartId);
    }
}

function drawBoxplot(data, selector, chartId) {
    const svg = d3.select(selector);
    
    // Xóa nội dung cũ nếu có
    svg.selectAll("*").remove();
    
    const groups = { Yes: [], No: [] };
    const statusLabels = { Yes: "Có bệnh tim", No: "Không có bệnh tim" };
    const colors = { Yes: "#ff6b6b", No: "#4dabf7" };

    data.forEach(d => {
        const status = d["Heart Disease Status"];
        const chol = parseFloat(d["Cholesterol Level"]);
        if (status && !isNaN(chol)) {
            groups[status]?.push(chol);
        }
    });

    const summary = Object.entries(groups).map(([group, values]) => {
        values.sort(d3.ascending);
        const q1 = d3.quantile(values, 0.25);
        const median = d3.quantile(values, 0.5);
        const q3 = d3.quantile(values, 0.75);
        const iqr = q3 - q1;
        const min = values.find(v => v >= q1 - 1.5 * iqr) || Math.min(...values);
        const max = values.reverse().find(v => v <= q3 + 1.5 * iqr) || Math.max(...values);
        return { group, q1, median, q3, min, max };
    });

    const margin = { top: 40, right: 80, bottom: 60, left: 70 };
    const width = +svg.attr("width") - margin.left - margin.right;
    const height = +svg.attr("height") - margin.top - margin.bottom;
    const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().domain(["No", "Yes"]).range([0, width]).padding(0.4);
    const y = d3.scaleLinear()
        .domain([d3.min(summary, d => d.min) * 0.95, d3.max(summary, d => d.max) * 1.05])
        .nice()
        .range([height, 0]);

    // Axes với nhãn tiếng Việt
    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d => statusLabels[d]));
    
    chart.append("g")
        .call(d3.axisLeft(y).ticks(8));

    // Nhãn trục X
    chart.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .text("Tình trạng bệnh tim");

    // Nhãn trục Y
    chart.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .text("Mức độ Cholesterol (mg/dL)");

    // Tooltip
    let tooltip = d3.select("body").select(".tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body").append("div").attr("class", "tooltip");
    }

    // Vẽ từng boxplot
    summary.forEach(d => {
        const center = x(d.group) + x.bandwidth() / 2;
        const boxWidth = x.bandwidth() * 0.6;

        // Đường thẳng từ min đến max
        chart.append("line")
            .attr("x1", center)
            .attr("x2", center)
            .attr("y1", y(d.min))
            .attr("y2", y(d.max))
            .attr("stroke", "black");

        // Hộp chính
        chart.append("rect")
            .attr("x", center - boxWidth / 2)
            .attr("y", y(d.q3))
            .attr("width", boxWidth)
            .attr("height", y(d.q1) - y(d.q3))
            .attr("fill", colors[d.group])
            .attr("stroke", "black")
            .on("mouseover", (event) => {
                tooltip.style("opacity", 1)
                    .html(`<strong>${statusLabels[d.group]}</strong><br>
                        Trung vị: ${Math.round(d.median)} mg/dL<br>
                        Q1: ${Math.round(d.q1)} mg/dL<br>
                        Q3: ${Math.round(d.q3)} mg/dL<br>
                        Thấp nhất: ${Math.round(d.min)} mg/dL<br>
                        Cao nhất: ${Math.round(d.max)} mg/dL`)
                    .style("left", event.pageX + 10 + "px")
                    .style("top", event.pageY - 28 + "px");
            })
            .on("mouseout", () => tooltip.style("opacity", 0));

        // Đường trung vị
        chart.append("line")
            .attr("x1", center - boxWidth / 2)
            .attr("x2", center + boxWidth / 2)
            .attr("y1", y(d.median))
            .attr("y2", y(d.median))
            .attr("stroke", "black")
            .attr("stroke-width", 2);

        // Dấu tick Min/Max
        chart.append("line")
            .attr("x1", center - boxWidth / 4)
            .attr("x2", center + boxWidth / 4)
            .attr("y1", y(d.min))
            .attr("y2", y(d.min))
            .attr("stroke", "black");

        chart.append("line")
            .attr("x1", center - boxWidth / 4)
            .attr("x2", center + boxWidth / 4)
            .attr("y1", y(d.max))
            .attr("y2", y(d.max))
            .attr("stroke", "black");
        
        // Hiển thị giá trị trung vị
        chart.append("text")
            .attr("x", center)
            .attr("y", y(d.median) - 10)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .text(`${Math.round(d.median)}`);
            
        // Hiển thị giá trị min và max
        chart.append("text")
            .attr("x", center)
            .attr("y", y(d.max) - 10)
            .attr("text-anchor", "middle")
            .attr("font-size", "11px")
            .text(`${Math.round(d.max)}`);
            
        chart.append("text")
            .attr("x", center)
            .attr("y", y(d.min) + 15)
            .attr("text-anchor", "middle")
            .attr("font-size", "11px")
            .text(`${Math.round(d.min)}`);
    });
    
    // Chú thích màu
    const legend = svg.append("g").attr("transform", `translate(${width + margin.left - 40}, ${margin.top + 10})`);
    
    Object.entries(statusLabels).forEach(([status, label], i) => {
        legend.append("rect")
            .attr("x", 0)
            .attr("y", i * 25)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", colors[status]);
            
        legend.append("text")
            .attr("x", 20)
            .attr("y", i * 25 + 12)
            .text(label)
            .attr("font-size", "12px");
    });
    
    if (chartId) {
        addChartCaption(selector, chartId);
    }
}

// Hàm thiết lập filter và sort cho biểu đồ
function setupChartFilters(selector, originalData) {
    // Lưu trữ dữ liệu gốc để dùng khi filter/sort
    const chartData = [...originalData];
    const svgSelector = selector;
    
    // Lấy các phần tử DOM
    const chartContainer = document.querySelector(`${selector}`).closest('.chart-card');
    const filterCheckboxes = chartContainer.querySelectorAll('input[name="filter-heart"]');
    const sortRadios = chartContainer.querySelectorAll('input[name="sort-order"]');
    const sortPanel = chartContainer.querySelector('.sort-panel');
    
    // Trạng thái hiện tại
    let activeFilters = ["Yes", "No"];
    let sortOrder = "default";
    
    // Hàm cập nhật trạng thái hiển thị của bảng sắp xếp
    function updateSortPanelVisibility() {
        // Chỉ hiển thị bảng sắp xếp khi có đúng 1 loại dữ liệu được chọn
        if (activeFilters.length === 1) {
            sortPanel.style.display = "block";
        } else {
            sortPanel.style.display = "none";
            // Reset về sắp xếp mặc định khi ẩn bảng sắp xếp
            const defaultRadio = Array.from(sortRadios).find(radio => radio.value === "default");
            if (defaultRadio) {
                defaultRadio.checked = true;
                sortOrder = "default";
            }
        }
    }
    
    // Hàm xử lý khi filter thay đổi
    function handleFilterChange() {
        // Reset active filters
        activeFilters = [];
        
        // Lấy checkbox "Tất cả"
        const allCheckbox = Array.from(filterCheckboxes).find(cb => cb.value === 'all');
        
        if (allCheckbox.checked) {
            // Khi "Tất cả" được chọn:
            // 1. Hiển thị cả hai loại dữ liệu
            activeFilters = ["Yes", "No"];
            
            // 2. Bỏ chọn hai checkbox còn lại
            filterCheckboxes.forEach(cb => {
                if (cb.value !== 'all') cb.checked = false;
            });
        } else {
            // Khi "Tất cả" không được chọn, lấy giá trị từ các checkbox đã chọn
            filterCheckboxes.forEach(cb => {
                if (cb.checked && cb.value !== 'all') {
                    activeFilters.push(cb.value);
                }
            });
            
            // Nếu không có nhóm nào được chọn, mặc định chọn lại "Tất cả"
            if (activeFilters.length === 0) {
                activeFilters = ["Yes", "No"];
                allCheckbox.checked = true;
                filterCheckboxes.forEach(cb => {
                    if (cb.value !== 'all') cb.checked = false;
                });
            }
        }
        
        // Cập nhật hiển thị bảng sắp xếp
        updateSortPanelVisibility();
        
        // Vẽ lại biểu đồ với dữ liệu đã lọc và sắp xếp
        updateChart();
    }
    
    // Hàm xử lý khi sort thay đổi
    function handleSortChange() {
        // Lấy giá trị sort order từ radio button
        sortRadios.forEach(radio => {
            if (radio.checked) {
                sortOrder = radio.value;
            }
        });
        
        // Vẽ lại biểu đồ
        updateChart();
    }
    
    // Hàm cập nhật biểu đồ dựa trên filter và sort
    function updateChart() {
        let filteredData = chartData.map(d => {
            // Tạo bản sao của dữ liệu gốc
            const newItem = { ...d, group: d.group };
            
            // Nếu một nhóm không được chọn, đặt giá trị thành 0
            if (!activeFilters.includes("Yes")) newItem.Yes = 0;
            if (!activeFilters.includes("No")) newItem.No = 0;
            
            return newItem;
        });
        
        // Sắp xếp dữ liệu nếu cần
        if (sortOrder !== "default") {
            filteredData.sort((a, b) => {
                // Nếu chỉ hiển thị một loại dữ liệu, sắp xếp theo loại đó
                const sortKey = activeFilters[0]; // Vì đã đảm bảo chỉ có 1 loại được chọn khi hiển thị bảng sort
                const valueA = a[sortKey];
                const valueB = b[sortKey];
                
                if (sortOrder === "ascending") {
                    return valueA - valueB;
                } else {
                    return valueB - valueA;
                }
            });
        } else {
            // Khôi phục thứ tự ban đầu dựa trên nhóm tuổi
            const ageOrder = ["<30", "30-39", "40-49", "50-59", "60+"];
            filteredData.sort((a, b) => ageOrder.indexOf(a.group) - ageOrder.indexOf(b.group));
        }
        
        // Vẽ lại biểu đồ với dữ liệu đã xử lý
        drawGroupedBarChart(svgSelector, filteredData, "Nhóm tuổi", "Số lượng", {
            filterableGroups: ["Yes", "No"],
            activeFilters: activeFilters,
            sortable: true,
            chartId: parseInt(svgSelector.match(/\d+/)[0])
        });
    }
    
    // Đăng ký sự kiện cho các phần tử UI
    filterCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            // Xử lý checkbox "Tất cả" đặc biệt
            if (cb.value === 'all') {
                if (cb.checked) {
                    // Khi "Tất cả" được chọn, bỏ chọn các checkbox khác
                    filterCheckboxes.forEach(checkbox => {
                        if (checkbox.value !== 'all') checkbox.checked = false;
                    });
                } else {
                    // Không cho phép bỏ chọn "Tất cả" trực tiếp
                    cb.checked = true;
                }
            } else {
                // Khi chọn một checkbox cụ thể
                if (cb.checked) {
                    // Bỏ chọn "Tất cả"
                    const allCheckbox = Array.from(filterCheckboxes).find(checkbox => checkbox.value === 'all');
                    allCheckbox.checked = false;
                    
                    // Kiểm tra nếu tất cả các checkbox cụ thể đều được chọn
                    const allSpecificChecked = Array.from(filterCheckboxes)
                        .filter(checkbox => checkbox.value !== 'all')
                        .every(checkbox => checkbox.checked);
                        
                    if (allSpecificChecked) {
                        // Nếu tất cả checkbox cụ thể đều được chọn, chuyển sang chế độ "Tất cả"
                        allCheckbox.checked = true;
                        filterCheckboxes.forEach(checkbox => {
                            if (checkbox.value !== 'all') checkbox.checked = false;
                        });
                    }
                } else {
                    // Kiểm tra nếu không checkbox nào được chọn
                    const anyChecked = Array.from(filterCheckboxes)
                        .some(checkbox => checkbox.checked && checkbox.value !== 'all');
                        
                    if (!anyChecked) {
                        // Nếu không có checkbox nào được chọn, chọn lại "Tất cả"
                        const allCheckbox = Array.from(filterCheckboxes).find(checkbox => checkbox.value === 'all');
                        allCheckbox.checked = true;
                    }
                }
            }
            
            handleFilterChange();
        });
    });
    
    sortRadios.forEach(radio => {
        radio.addEventListener('change', handleSortChange);
    });
    
    // Khởi tạo UI
    updateSortPanelVisibility();
}

// Thêm sau hàm setupChartFilters
// Hàm đọc caption từ file và thêm vào biểu đồ
function addChartCaption(selector, chartId) {
    const chartContainer = document.querySelector(`${selector}`).closest('.chart-card');
    const captionFile = `captions/Chart_${chartId}.txt`;
    
    // Kiểm tra và tạo caption box nếu chưa có
    let captionBox = chartContainer.querySelector('.chart-caption');
    if (!captionBox) {
        captionBox = document.createElement('div');
        captionBox.className = 'chart-caption';
        chartContainer.appendChild(captionBox);
    }
    
    // Đọc file caption
    fetch(captionFile)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Không tìm thấy file caption`);
            }
            return response.text();
        })
        .then(text => {
            // Xử lý văn bản để giữ nguyên xuống dòng
            // Thay thế các ký tự xuống dòng bằng <br> để HTML hiển thị đúng
            const formattedText = text.replace(/\n/g, '<br>');
            
            // Hiển thị nội dung caption với định dạng đúng
            captionBox.innerHTML = formattedText;
            
            // Đảm bảo caption box được hiển thị
            captionBox.style.display = 'block';
        })
        .catch(error => {
            // Nếu không đọc được file, để box trống
            captionBox.innerHTML = '';
            captionBox.style.display = 'none'; // Ẩn hẳn nếu không có dữ liệu
            console.log(`Không tìm thấy file caption cho biểu đồ ${chartId}`);
        });
}