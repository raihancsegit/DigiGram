import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    dynamicNews: [], // { id, title, content, unionId, wardId, date, author, image, category }
};

const newsSlice = createSlice({
    name: 'news',
    initialState,
    reducers: {
        addNews: (state, action) => {
            state.dynamicNews.unshift({
                id: Date.now().toString(),
                date: new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' }),
                ...action.payload,
            });
        },
    },
});

export const { addNews } = newsSlice.actions;
export default newsSlice.reducer;
