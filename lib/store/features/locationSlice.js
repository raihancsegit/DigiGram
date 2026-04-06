import { createSlice } from '@reduxjs/toolkit';

/**
 * ডিফল্ট: পবা · দামকুড়া (ডেমো পোর্টাল) — হেডার ও হোম কনটেক্সট।
 * মোডাল দিয়ে বদলালে `unionSlug` আপডেট হবে।
 */
const initialState = {
    isOpen: false,
    step: 1,
    selected: {
        district: 'রাজশাহী',
        districtId: 'rajshahi',
        upazila: 'পবা',
        upazilaId: 'paba',
        union: 'দামকুড়া',
        unionSlug: 'dumuria',
        ward: '',
        wardId: '',
        village: '',
    },
};

function clearFrom(state, fromLevel) {
    if (fromLevel === 'district') {
        state.selected.upazila = '';
        state.selected.upazilaId = '';
        state.selected.union = '';
        state.selected.unionSlug = '';
        state.selected.ward = '';
        state.selected.wardId = '';
        state.selected.village = '';
    }
    if (fromLevel === 'upazila') {
        state.selected.union = '';
        state.selected.unionSlug = '';
        state.selected.ward = '';
        state.selected.wardId = '';
        state.selected.village = '';
    }
    if (fromLevel === 'union') {
        state.selected.ward = '';
        state.selected.wardId = '';
        state.selected.village = '';
    }
    if (fromLevel === 'ward') {
        state.selected.village = '';
    }
}

const locationSlice = createSlice({
    name: 'location',
    initialState,
    reducers: {
        toggleModal: (state) => {
            state.isOpen = !state.isOpen;
        },
        openModal: (state) => {
            state.isOpen = true;
            state.step = 1;
        },
        setStepData: (state, action) => {
            const { level, value, districtId, upazilaId, unionSlug, wardId } = action.payload;
            if (level === 'district') {
                clearFrom(state, 'district');
                state.selected.district = value;
                if (districtId) state.selected.districtId = districtId;
            } else if (level === 'upazila') {
                clearFrom(state, 'upazila');
                state.selected.upazila = value;
                if (upazilaId) state.selected.upazilaId = upazilaId;
            } else if (level === 'union') {
                clearFrom(state, 'union');
                state.selected.union = value;
                if (unionSlug) state.selected.unionSlug = unionSlug;
            } else if (level === 'ward') {
                clearFrom(state, 'ward');
                state.selected.ward = value;
                if (wardId) state.selected.wardId = wardId;
            } else if (level === 'village') {
                state.selected.village = value;
            }
            if (state.step < 5 && level !== 'village') {
                state.step += 1;
            }
        },
        /** ডাইরেক্ট URL `/u/[slug]` থেকে স্টোর মিল রাখতে */
        applyLocationSnapshot: (state, action) => {
            state.selected = { ...state.selected, ...action.payload };
        },
        goBack: (state) => {
            if (state.step <= 1) return;
            state.step -= 1;
            const s = state.step;
            if (s === 1) clearFrom(state, 'district');
            else if (s === 2) clearFrom(state, 'upazila');
            else if (s === 3) clearFrom(state, 'union');
            else if (s === 4) clearFrom(state, 'ward');
            else if (s === 5) state.selected.village = '';
        },
        resetLocation: (state) => {
            state.step = 1;
            state.selected = {
                district: '',
                districtId: '',
                upazila: '',
                upazilaId: '',
                union: '',
                unionSlug: '',
                ward: '',
                wardId: '',
                village: '',
            };
            state.isOpen = false;
        },
    },
});

export const { toggleModal, openModal, setStepData, goBack, resetLocation, applyLocationSnapshot } = locationSlice.actions;
export default locationSlice.reducer;
