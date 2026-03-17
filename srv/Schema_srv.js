const { getDestination } = require('@sap-cloud-sdk/connectivity');
const { executeHttpRequest } = require('@sap-cloud-sdk/http-client');
const cds = require('@sap/cds');
require('dotenv').config();
const fetch = require("node-fetch"); // Asegúrate de usar node-fetch si estás en CAP (Node.js


module.exports = async (srv) => {


    const destinationName = 'test'
    const srv_test_v2 = '/odata/v2/Catalog/'

    srv.on('test', async (req) => {

        return 'true 2'
    })

    srv.on('getClasesDoc', async req => {

        try {
            // Obtener el destino
            const destination = await getDestination({ destinationName: destinationName });

            if (!destination) {
                return req.error(400, `No se pudo obtener el destino HTTP`);
            }

            //hacer peticion
            const response = await executeHttpRequest(destination, {
                method: 'GET',
                url: `${srv_test_v2}ClasesDoc`
            });

            if (!response) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }

            //obtener resultado
            const result = response.data?.d?.results;

            //devolver resultado
            const transformed = result.map(item => ({
                id: item.id,
                sub: item.sub,
                descripcion: item.descripcion,
            }));

            return transformed;

        } catch (err) {
            return req.error(500, `Error al llamar servicio para clases de documentos: ${err.message}`);
        }
    });


    srv.on('BPA', async (req) => {


        const userProvided = JSON.parse(process.env.VCAP_SERVICES || "{}")["user-provided"];
        let credentials;

        if (userProvided) {
            const bpaService = userProvided.find(service => service.name === "credentials");
            credentials = bpaService?.credentials;
        }

        /*const clientId = credentials?.BPA_CLIENT_ID;
        const clientSecret = credentials?.BPA_CLIENT_SECRET;
        const tokenUrl = credentials?.BPA_TOKEN_URL;
        const apiUrl = credentials?.BPA_API_URL;
        const irpaApiKey = credentials?.BPA_API_KEY;*/

        const clientId = "sb-280b9b0f-b62b-4da2-bc00-0d93e5ec76f1!b613422|xsuaa!b49390";
        const clientSecret = "ea67d956-1d7d-4518-a13c-b096d82c7e11$VfkM7-kwdBfLrMqzyDfC6u2yyod4vnmB5x-B_beC1I8=";
        const tokenUrl = "https://cf-unisalle-60u3c5oz.authentication.us10.hana.ondemand.com/oauth/token";
        const apiUrl = "https://spa-api-gateway-bpi-us-prod.cfapps.us10.hana.ondemand.com/public/irpa/runtime/v1/apiTriggers/1bab4823-dc89-45fa-aec3-de32eba25382/runs";
        const irpaApiKey = "_f-D4kq7lSqqw1LV_MHYO4Ob8IRx2M7b";

        //var datos = req.data.input;

        var datos = {
            input: {
                purchaseOrderData: {
                    "clasedoc": "",
                    "grpcompras": "",
                    "postipo": "",
                    "imptipo": "",
                    "centro": "",
                    "grpart": "",
                    "solicitante": "",
                    "nota": "",
                    "listado": []
                }
            }
        }


        var payloadString = JSON.stringify(datos);

        try {

            // Paso 1: Token
            const tokenResponse = await fetch(tokenUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: new URLSearchParams({
                    grant_type: "client_credentials",
                    client_id: clientId,
                    client_secret: clientSecret
                })
            });

            if (!tokenResponse.ok) {
                throw new Error("Error al obtener token");
            }

            const tokenData = await tokenResponse.json();
            const accessToken = tokenData.access_token;

            // Paso 2: Llamar BPA
            const apiResponse = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                    "irpa-api-key": irpaApiKey
                },
                body: payloadString
            });

            if (!apiResponse.ok) {
                throw new Error("Error al llamar al API de BPA");
            }

            // AQUÍ ESTÁ LO QUE NECESITAS
            const responseBody = await apiResponse.json();

            console.log("Respuesta BPA:", responseBody);

            return responseBody;

        } catch (error) {
            console.log(`Error en la integración: ${error}`);
            throw new Error("Error en la integración BPA2");
        }
    });
   

}