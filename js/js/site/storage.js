// ======================================================
// OBȚINE CALEA DIN URL
// ======================================================

function obtineCaleStorage(url) {

    if (!url) {
        return null;
    }

    try {

        const marker =
            "/storage/v1/object/";

        const index =
            url.indexOf(marker);

        if (index === -1) {

            return null;

        }


        const dupaMarker =
            url.substring(
                index + marker.length
            );


        const pozitii =
            dupaMarker.indexOf("/");


        if (pozitii === -1) {

            return null;

        }


        const cale =
            dupaMarker.substring(
                pozitii + 1
            );


        return decodeURIComponent(cale);

    } catch (error) {

        console.error(
            "Eroare extragere cale:",
            error
        );

        return null;
    }
}


