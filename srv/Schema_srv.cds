service capsolped {
    function test() returns String;
    function getClasesDoc() returns array of {
        id: String;
        descripcion: String;
        sub: String;
    };
    function BPA(input: String) returns String;
}
