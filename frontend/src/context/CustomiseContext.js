import { createContext, useReducer } from 'react';

export const CustomiseContext = createContext();

export const customiseReducer = (state, action) => {
    switch (action.type) {
        case 'SET_CUSTOM_ITEM':
            return {
                customItem: action.payload,
                updatedAt: new Date().toISOString()
            };

        case 'SET_TOP_IMAGE':
            return {
                ...state,
                customItem: {
                    ...state.customItem,
                    top_image: action.payload
                },
                updatedAt: new Date().toISOString()
            };

        case 'SET_BOTTOM_IMAGE':
            return {
                ...state,
                customItem: {
                    ...state.customItem,
                    bottom_image: action.payload
                },
                updatedAt: new Date().toISOString()
            };

        case 'CLEAR_CUSTOM_ITEM':
            return {
                customItem: null
            };
        default:
            return state;
    }
};

export const CustomiseContextProvider = ({ children }) => {
    const [state, dispatch] = useReducer(customiseReducer, {
        customItem: null
    });

    return (
        <CustomiseContext.Provider value={{ ...state, dispatch }}>
            {children}
        </CustomiseContext.Provider>
    );
};