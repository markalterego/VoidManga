import { COMMANDS } from "./export.js"; 
const { PAGE } = COMMANDS;

function updatePageDetails (pageDetails, sortedContent) {
    // calculating lastPageIndex
    pageDetails.lastPageIndex = sortedContent.length > 10 ? Math.ceil(sortedContent.length / 10) - 1 : 0;
    // checking currentPageIndex value
    const isAllowedPage = pageDetails.currentPageIndex <= pageDetails.lastPageIndex;
    // set currentPage to lastPage if not allowed
    if (!isAllowedPage) pageDetails.currentPageIndex = pageDetails.lastPageIndex;
    return pageDetails;
}

function pageContent (sortedContent, currentPage, enablePaging) {
    // page content (sortedMangas/sortedChapters)
    if (enablePaging) { 
        // page is always of 10 length, unless 
        // there's not enough items to fill it
        let startIndex = currentPage > 0 ? currentPage * 10 : 0; // 0, 10, 20
        let endIndex = startIndex + 9; // 0 -> 9, 10 -> 19, 20 -> 30
        // filter 10 mangas from sortedMangas by range of startIndex - endIndex 
        return sortedContent.filter((_, index) => {
            return index >= startIndex && index <= endIndex;
        });
    } 
    return sortedContent;
}

function pagingOptions (input, sortedContent, pageDetails) {
    const isSpecificPage = (input) => {
        return /^p[0-9]+$/i.test(input);
    };
    if (input === PAGE.NEXT) { // next page
        if (sortedContent.length / 10 > 0 && pageDetails.currentPageIndex + 1 <= pageDetails.lastPageIndex) {
            pageDetails.currentPageIndex++; 
        } 
    } else if (input === PAGE.PREVIOUS) { // previous page
        if ((sortedContent.length / 10 > 0) && (pageDetails.currentPageIndex - 1) >= 0) {
            pageDetails.currentPageIndex--; 
        }
    } else if (input === PAGE.LAST) { // navigate to last page
        if (sortedContent.length / 10 > 0) {
            pageDetails.currentPageIndex = pageDetails.lastPageIndex;
        }
    } else if (input === PAGE.FIRST) { // navigate to first page
        if (sortedContent.length / 10 > 0) {
            pageDetails.currentPageIndex = 0;
        }
    } else if (isSpecificPage(input)) { // navigate to specific page
        const pageNumIndex = Number(input.slice(1)) - 1;
        if ((sortedContent.length / 10 > 0) && pageNumIndex >= 0 && pageNumIndex <= pageDetails.lastPageIndex) {
            pageDetails.currentPageIndex = pageNumIndex;
        }
    } 
    return pageDetails;
}

function isPagingInput (input) { 
    return Object.values(PAGE).some(c => c === input) || input?.[0] === 'p';
}

export { updatePageDetails, pageContent, pagingOptions, isPagingInput };