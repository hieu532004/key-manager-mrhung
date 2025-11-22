# Minimax Key Manager (Next.js + MongoDB)

Web quản lý key cho tool Minimax Premium.

## Cấu trúc chính

- `pages/index.js`: Giao diện quản lý key.
- `pages/api/keys.js`: API JSON trả về danh sách key cho tool Python.
- `lib/mongodb.js`: Kết nối MongoDB Atlas.
- `public/minimax/script.js`: File script JS để tool lấy bằng URL `/minimax/script.js`.
- `.env.local.example`: Mẫu cấu hình môi trường.

## Chạy local

1. Cài dependencies:

   ```bash
   npm install
   ```

2. Tạo file `.env.local` từ mẫu:

   ```bash
   cp .env.local.example .env.local
   ```

3. Chạy dev:

   ```bash
   npm run dev
   ```

   Mặc định chạy ở `http://localhost:3000`.

Tool Python (`minimax_tool.py`) sẽ gọi:

- `http://localhost:3000/api/keys` để lấy danh sách key (JSON)
- `http://localhost:3000//minimax/script.js` để load script JS

> Lưu ý: Khi deploy lên Vercel, hãy đổi URL trong tool Python từ `localhost:3000` sang domain Vercel của bạn.

## Deploy lên Vercel

1. Push code này lên GitHub/GitLab/Bitbucket.
2. Tạo project trên Vercel, kết nối repo.
3. Thiết lập biến môi trường trong Vercel:

   - `MONGODB_URI`
   - `MONGODB_DB` (minimax)
   - `MONGODB_COLLECTION` (keys)

4. Deploy xong là dùng được.

