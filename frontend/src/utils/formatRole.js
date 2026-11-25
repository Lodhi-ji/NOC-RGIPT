export const formatRole = (role) => {
    if (role === 'CDCChairperson') return 'CDC Chairperson';
    if (role === 'TNPOffice') return 'TNP Office';
    if (role === 'DeptOfficer') return 'Department Officer';
    if (role === 'TNPHead') return 'Chairman T&P';
    return role;
};
