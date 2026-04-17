import axios from 'axios';

export const bookApi = {
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