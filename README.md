# heart-project


# Bước 1: Khởi tạo npm
npm init -y
# Bước 2: Cài http-server (server tĩnh)
npm install --save-dev http-server
# Bước 3: Thêm lệnh script vào package.json
Mở file package.json và thêm dòng sau vào "scripts":
"scripts": {
  "start": "http-server -p 8080"
}
