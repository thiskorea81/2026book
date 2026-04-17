// src/services/bookApi.js
import axios from 'axios';

export const bookApi = {
  /**
   * 📚 ISBN으로 네이버 도서 검색 API 호출
   * vite.config.js에 설정된 /v1 프록시를 통해 CORS 문제를 회피합니다.
   */
  async fetchBookByIsbn(isbn) {
    if (!isbn || isbn.length < 10) return null;

    try {
      const response = await axios.get('/v1/search/book_adv.json', {
        params: { d_isbn: isbn.replace(/-/g, '') },
        headers: {
          'X-Naver-Client-Id': import.meta.env.VITE_NAVER_CLIENT_ID,
          'X-Naver-Client-Secret': import.meta.env.VITE_NAVER_CLIENT_SECRET
        }
      });

      if (response.data.items && response.data.items.length > 0) {
        const item = response.data.items[0];
        return {
          title: item.title,
          author: item.author,
          publisher: item.publisher,
          price: item.discount || item.price,
        };
      }
      return null;
    } catch (error) {
      console.error(`ISBN(${isbn}) 조회 실패:`, error);
      return null;
    }
  }
};