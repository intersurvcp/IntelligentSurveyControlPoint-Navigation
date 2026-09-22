// ============================================================
// INTERSURV WEBSITE
// FIRESTORE + GOOGLE MAP + CONTROL POINTS + TRAVERSE
// ============================================================


// ============================================================
// HOME PAGE BUTTONS
// ============================================================

const btnStart =
    document.getElementById("btnStart");

const btnAbout =
    document.getElementById("btnAbout");

const btnSettings =
    document.getElementById("btnSettings");

const btnAdmin =
    document.getElementById("btnAdmin");


if (btnStart) {

    btnStart.addEventListener(
        "click",
        function () {

            window.location.href =
                "map.html";

        }
    );

}


if (btnAbout) {

    btnAbout.addEventListener(
        "click",
        function () {

            window.location.href =
                "about.html";

        }
    );

}


if (btnSettings) {

    btnSettings.addEventListener(
        "click",
        function () {

            window.location.href =
                "settings.html";

        }
    );

}


if (btnAdmin) {

    btnAdmin.addEventListener(
        "click",
        function () {

            window.location.href =
                "admin.html";

        }
    );

}


// ============================================================
// BACK TO HOME
// ============================================================

function goHome() {

    window.location.href =
        "index.html";

}


// ============================================================
// NAVIGATION
// ============================================================

function navigateToPoint(
    lat,
    lng
) {

    const url =
        "https://www.google.com/maps/dir/?api=1" +
        "&destination=" +
        lat +
        "," +
        lng;

    window.open(
        url,
        "_blank"
    );

}


// ============================================================
// CLOSE DETAILS
// ============================================================

function closeDetails() {

    const pointInfo =
        document.getElementById(
            "pointInfo"
        );

    if (pointInfo) {

        pointInfo.style.display =
            "none";

    }

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// ============================================================
// GOOGLE MAP
// ============================================================

async function initMap() {


    // ========================================================
    // FIREBASE
    // ========================================================

    let db;

    try {

        const firebaseModule =
            await import(
                "./firebase-config.js"
            );

        db =
            firebaseModule.db;

    } catch (error) {

        console.error(
            "Firebase could not be loaded:",
            error
        );

        alert(
            "Unable to connect to Firebase."
        );

        return;

    }


    // ========================================================
    // FIRESTORE MODULE
    // ========================================================

    const firestoreModule =
        await import(
            "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js"
        );


    const {
        collection,
        getDocs
    } =
        firestoreModule;


    // ========================================================
    // MAP CENTRE
    // ========================================================

    const polytechnicMerlimau = {

        lat:
            2.1688,

        lng:
            102.4275

    };


    // ========================================================
    // MAP
    // ========================================================

    const mapElement =
        document.getElementById(
            "map"
        );


    if (!mapElement) {

        console.error(
            "Map element not found."
        );

        return;

    }


    const map =
        new google.maps.Map(
            mapElement,
            {

                center:
                    polytechnicMerlimau,

                zoom:
                    17,

                // IMPORTANT:
                // Allows one-finger movement on mobile.
                gestureHandling:
                    "greedy",

                mapTypeControl:
                    true,

                streetViewControl:
                    false,

                fullscreenControl:
                    true,

                zoomControl:
                    true

            }
        );


    // ========================================================
    // LOAD CONTROL POINTS
    // ========================================================

    let controlPoints =
        [];


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "control_points"
                )
            );


        controlPoints =
            snapshot.docs.map(
                function (
                    document
                ) {

                    const data =
                        document.data();


                    return {

                        id:
                            document.id,

                        name:
                            data.pointCode ||
                            document.id,

                        type:
                            data.pointType ||
                            "",

                        lat:
                            Number(
                                data.latitude
                            ),

                        lng:
                            Number(
                                data.longitude
                            ),

                        northing:
                            Number(
                                data.northing
                            ),

                        easting:
                            Number(
                                data.easting
                            ),

                        height:
                            Number(
                                data.elevation
                            ),

                        monumentStatus:
                            data.monumentStatus ||
                            "Good",

                        description:
                            data.description ||
                            "",

                        imageUrls:
                            Array.isArray(
                                data.imageUrls
                            )
                                ? data.imageUrls
                                    .filter(
                                        function (
                                            item
                                        ) {

                                            return (
                                                item &&
                                                typeof item ===
                                                    "object" &&
                                                item.url
                                            );

                                        }
                                    )
                                    .map(
                                        function (
                                            item
                                        ) {

                                            return {

                                                url:
                                                    item.url,

                                                fileId:
                                                    item.fileId ||
                                                    ""

                                            };

                                        }
                                    )
                                : [],

                        imageUrl:
                            data.imageUrl ||
                            ""

                    };

                }
            );


    } catch (error) {

        console.error(
            "Error loading control points:",
            error
        );

        alert(
            "Unable to load control points from Firebase."
        );

        return;

    }


    console.log(
        "Control points loaded:",
        controlPoints.length
    );


    // ========================================================
    // STATE
    // ========================================================

    let selectedPoint =
        null;


    let traverseMode =
        false;


    // TRUE ONLY while user is adding stations.
    let isAddingStations =
        false;


    let stationPoints =
        [];


    let traverseLines =
        [];


    let traverseLabels =
        [];


    const markers =
        [];


    // ========================================================
    // UI ELEMENTS
    // ========================================================

    const controlPointSelect =
        document.getElementById(
            "controlPointSelect"
        );


    const searchControlPointButton =
        document.getElementById(
            "searchControlPointButton"
        );


    const controlPointSearchPanel =
        document.getElementById(
            "controlPointSearchPanel"
        );


    const traverseButton =
        document.getElementById(
            "traverseButton"
        );


    const traversePanel =
        document.getElementById(
            "traversePanel"
        );


    const traverseStatus =
        document.getElementById(
            "traverseStatus"
        );


    const traverseResults =
        document.getElementById(
            "traverseResults"
        );


    const clearTraverseButton =
        document.getElementById(
            "clearTraverseButton"
        );


    let addStationButton =
        document.getElementById(
            "addStationButton"
        );


    const detailsButton =
        document.getElementById(
            "detailsButton"
        );


    const locationButton =
        document.getElementById(
            "locationButton"
        );


    // ========================================================
    // CREATE ADD STATION BUTTON IF MISSING
    // ========================================================

    if (!addStationButton) {

        addStationButton =
            document.createElement(
                "button"
            );


        addStationButton.id =
            "addStationButton";


        addStationButton.className =
            "add-station-button";


        addStationButton.textContent =
            "+ ADD STATION";


        document.body.appendChild(
            addStationButton
        );

    }


    // ========================================================
    // SEARCH BUTTON
    // ========================================================

    if (
        searchControlPointButton &&
        controlPointSearchPanel
    ) {

        searchControlPointButton.addEventListener(
            "click",
            function () {

                controlPointSearchPanel.classList.toggle(
                    "active"
                );

            }
        );

    }


    // ========================================================
    // DROPDOWN OPTIONS
    // ========================================================

    if (controlPointSelect) {

        controlPointSelect.innerHTML =
            `
                <option value="">
                    -- Select a Control Point --
                </option>
            `;


        controlPoints.forEach(
            function (
                point,
                index
            ) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    String(index);


                option.textContent =
                    point.name;


                controlPointSelect.appendChild(
                    option
                );

            }
        );

    }


    // ========================================================
    // STATION LIST
    // ========================================================

    let stationList =
        document.getElementById(
            "stationList"
        );


    if (!stationList) {

        stationList =
            document.createElement(
                "div"
            );


        stationList.id =
            "stationList";


        stationList.className =
            "station-list";


        stationList.innerHTML =
            `
                <button
                    type="button"
                    class="close-station-list"
                    id="closeStationList"
                    aria-label="Close Traverse Stations"
                >
                    ×
                </button>

                <h3>
                    Traverse Stations
                </h3>

                <ol id="stations"></ol>
            `;


        document.body.appendChild(
            stationList
        );

    }


    // ========================================================
    // STATION LIST ELEMENT
    // ========================================================

    const stationsListElement =
        document.getElementById(
            "stations"
        );


    // ========================================================
    // CLOSE STATION LIST
    // ========================================================

    const closeStationListButton =
        document.getElementById(
            "closeStationList"
        );


    if (closeStationListButton) {

        closeStationListButton.addEventListener(
            "click",
            function () {

                stationList.style.display =
                    "none";

            }
        );

    }


    // ========================================================
    // INITIAL UI STATE
    // ========================================================

    addStationButton.style.display =
        "none";


    stationList.style.display =
        "none";


    // ========================================================
    // PHOTO URLS
    // ========================================================

    function getPhotoUrls(
        point
    ) {

        const urls =
            [];


        if (
            Array.isArray(
                point.imageUrls
            )
        ) {

            point.imageUrls.forEach(
                function (
                    item
                ) {

                    if (
                        item &&
                        item.url
                    ) {

                        urls.push(
                            item.url
                        );

                    }

                }
            );

        }


        if (
            urls.length === 0 &&
            point.imageUrl
        ) {

            urls.push(
                point.imageUrl
            );

        }


        return urls;

    }


    // ========================================================
    // PHOTO GALLERY HTML
    // ========================================================

    function createPhotoGallery(
        point
    ) {

        const urls =
            getPhotoUrls(
                point
            );


        if (
            urls.length === 0
        ) {

            return `
                <div class="no-photo">
                    Photo not available
                </div>
            `;

        }


        const galleryId =
            "gallery_" +
            String(
                point.id
            ).replace(
                /[^a-zA-Z0-9_-]/g,
                ""
            );


        let slides =
            "";


        urls.forEach(
            function (
                url,
                index
            ) {

                slides +=
                    `
                        <div
                            class="monument-gallery-slide"
                            data-index="${index}"
                            style="
                                display:${index === 0 ? "flex" : "none"};
                            "
                        >

                            <img
                                src="${escapeHTML(url)}"
                                class="control-point-photo"
                                alt="${escapeHTML(point.name)}"
                            >

                        </div>
                    `;

            }
        );


        return `
            <div
                class="monument-gallery"
                id="${galleryId}"
                data-current="0"
            >

                <div class="monument-gallery-viewport">

                    ${slides}

                    ${
                        urls.length > 1
                            ? `
                                <button
                                    type="button"
                                    class="monument-gallery-arrow monument-gallery-prev"
                                >
                                    ‹
                                </button>

                                <button
                                    type="button"
                                    class="monument-gallery-arrow monument-gallery-next"
                                >
                                    ›
                                </button>
                            `
                            : ""
                    }

                </div>

                ${
                    urls.length > 1
                        ? `
                            <div class="monument-gallery-controls">

                                <div class="monument-gallery-dots">

                                    ${urls
                                        .map(
                                            function (
                                                _,
                                                index
                                            ) {

                                                return `
                                                    <button
                                                        type="button"
                                                        class="monument-gallery-dot ${
                                                            index === 0
                                                                ? "active"
                                                                : ""
                                                        }"
                                                        data-index="${index}"
                                                    ></button>
                                                `;

                                            }
                                        )
                                        .join("")}

                                </div>

                                <span class="monument-gallery-counter">
                                    1 / ${urls.length}
                                </span>

                            </div>
                        `
                        : ""
                }

            </div>
        `;

    }


    // ========================================================
    // SETUP PHOTO GALLERY
    // ========================================================

    function setupPhotoGallery(
        container
    ) {

        const gallery =
            container.querySelector(
                ".monument-gallery"
            );


        if (!gallery) {
            return;
        }


        const slides =
            gallery.querySelectorAll(
                ".monument-gallery-slide"
            );


        const dots =
            gallery.querySelectorAll(
                ".monument-gallery-dot"
            );


        const counter =
            gallery.querySelector(
                ".monument-gallery-counter"
            );


        function showPhoto(
            index
        ) {

            if (
                slides.length === 0
            ) {
                return;
            }


            if (
                index < 0
            ) {

                index =
                    slides.length - 1;

            }


            if (
                index >=
                slides.length
            ) {

                index =
                    0;

            }


            slides.forEach(
                function (
                    slide,
                    slideIndex
                ) {

                    slide.style.display =
                        slideIndex === index
                            ? "flex"
                            : "none";

                }
            );


            dots.forEach(
                function (
                    dot,
                    dotIndex
                ) {

                    dot.classList.toggle(
                        "active",
                        dotIndex === index
                    );

                }
            );


            if (counter) {

                counter.textContent =
                    (
                        index + 1
                    ) +
                    " / " +
                    slides.length;

            }


            gallery.dataset.current =
                String(index);

        }


        const previousButton =
            gallery.querySelector(
                ".monument-gallery-prev"
            );


        const nextButton =
            gallery.querySelector(
                ".monument-gallery-next"
            );


        if (previousButton) {

            previousButton.addEventListener(
                "click",
                function () {

                    const current =
                        Number(
                            gallery.dataset.current ||
                            0
                        );


                    showPhoto(
                        current - 1
                    );

                }
            );

        }


        if (nextButton) {

            nextButton.addEventListener(
                "click",
                function () {

                    const current =
                        Number(
                            gallery.dataset.current ||
                            0
                        );


                    showPhoto(
                        current + 1
                    );

                }
            );

        }


        dots.forEach(
            function (
                dot
            ) {

                dot.addEventListener(
                    "click",
                    function () {

                        showPhoto(
                            Number(
                                dot.dataset.index
                            )
                        );

                    }
                );

            }
        );

    }


    // ========================================================
    // SHOW CONTROL POINT DETAILS
    // ========================================================

    function showControlPointDetails(
        point
    ) {

        const pointInfo =
            document.getElementById(
                "pointInfo"
            );


        if (
            !pointInfo ||
            !point
        ) {

            return;

        }


        selectedPoint =
            point;


        pointInfo.innerHTML =
            `
                <button
                    type="button"
                    class="close-details"
                    onclick="closeDetails()"
                    aria-label="Close details"
                >
                    ×
                </button>


                <h2>
                    ${escapeHTML(point.name)}
                </h2>


                ${createPhotoGallery(point)}


                <p>
                    <strong>
                        Point Type:
                    </strong>
                    ${escapeHTML(point.type || "-")}
                </p>


                <p>
                    <strong>
                        Easting:
                    </strong>
                    ${
                        Number.isFinite(
                            point.easting
                        )
                            ? point.easting
                            : "-"
                    }
                </p>


                <p>
                    <strong>
                        Northing:
                    </strong>
                    ${
                        Number.isFinite(
                            point.northing
                        )
                            ? point.northing
                            : "-"
                    }
                </p>


                <p>
                    <strong>
                        Orthometric Height:
                    </strong>
                    ${
                        Number.isFinite(
                            point.height
                        )
                            ? point.height
                            : "-"
                    }
                </p>


                <p>
                    <strong>
                        Monument Status:
                    </strong>
                    ${escapeHTML(
                        point.monumentStatus ||
                        "-"
                    )}
                </p>


                ${
                    point.description
                        ? `
                            <p>
                                <strong>
                                    Description:
                                </strong>
                                ${escapeHTML(
                                    point.description
                                )}
                            </p>
                        `
                        : ""
                }


                <button
                    type="button"
                    class="navigate-button"
                    id="navigateSelectedPointButton"
                >
                    NAVIGATE
                </button>
            `;


        pointInfo.style.display =
            "block";


        setupPhotoGallery(
            pointInfo
        );


        const navigateButton =
            pointInfo.querySelector(
                "#navigateSelectedPointButton"
            );


        if (navigateButton) {

            navigateButton.addEventListener(
                "click",
                function () {

                    navigateToPoint(
                        point.lat,
                        point.lng
                    );

                }
            );

        }

    }


    // ========================================================
    // TRAVERSE LABEL
    // ========================================================

    class TraverseLabel
        extends google.maps.OverlayView {


        constructor(
            from,
            to,
            bearingText,
            distanceText
        ) {

            super();


            this.from =
                from;


            this.to =
                to;


            this.bearingText =
                bearingText;


            this.distanceText =
                distanceText;


            this.div =
                null;

        }


        onAdd() {

            this.div =
                document.createElement(
                    "div"
                );


            this.div.className =
                "traverse-map-label";


            this.div.innerHTML =
                `
                    <div class="traverse-bearing">
                        ${escapeHTML(
                            this.bearingText
                        )}
                    </div>

                    <div class="traverse-distance">
                        ${escapeHTML(
                            this.distanceText
                        )}
                    </div>
                `;


            this.getPanes()
                .floatPane
                .appendChild(
                    this.div
                );

        }

draw() {

    if (!this.div) {
        return;
    }

    const projection =
        this.getProjection();

    if (!projection) {
        return;
    }

    const fromLatLng =
        new google.maps.LatLng(
            this.from.lat,
            this.from.lng
        );

    const toLatLng =
        new google.maps.LatLng(
            this.to.lat,
            this.to.lng
        );

    const fromPixel =
        projection.fromLatLngToDivPixel(
            fromLatLng
        );

    const toPixel =
        projection.fromLatLngToDivPixel(
            toLatLng
        );

    if (
        !fromPixel ||
        !toPixel
    ) {
        return;
    }

    // Middle point of the traverse line
    const middleX =
        (
            fromPixel.x +
            toPixel.x
        ) / 2;

    const middleY =
        (
            fromPixel.y +
            toPixel.y
        ) / 2;


    // Calculate angle of the traverse line
    let angle =
        Math.atan2(
            toPixel.y -
            fromPixel.y,

            toPixel.x -
            fromPixel.x
        ) *
        180 /
        Math.PI;


    // Keep the text readable.
    // Prevent it from appearing upside-down.
    if (
        angle > 90 ||
        angle < -90
    ) {

        angle += 180;

    }


    // Position the bearing + distance
    // exactly along the traverse line.
    this.div.style.left =
        middleX + "px";

    this.div.style.top =
        middleY + "px";


    // Rotate the complete label
    // to follow the traverse line.
    this.div.style.transform =
        `translate(-50%, -50%) rotate(${angle}deg)`;

}


        onRemove() {

            if (this.div) {

                this.div.remove();

                this.div =
                    null;

            }

        }

    }


    // ========================================================
    // DISTANCE
    // ========================================================

    function calculateDistance(
        from,
        to
    ) {

        const deltaE =
            to.easting -
            from.easting;


        const deltaN =
            to.northing -
            from.northing;


        return Math.sqrt(
            (
                deltaE *
                deltaE
            ) +
            (
                deltaN *
                deltaN
            )
        );

    }


    // ========================================================
    // BEARING
    // ========================================================

    function calculateBearing(
        from,
        to
    ) {

        const deltaE =
            to.easting -
            from.easting;


        const deltaN =
            to.northing -
            from.northing;


        let bearing =
            Math.atan2(
                deltaE,
                deltaN
            ) *
            180 /
            Math.PI;


        if (
            bearing < 0
        ) {

            bearing +=
                360;

        }


        return bearing;

    }


    // ========================================================
    // BEARING FORMAT
    // ========================================================

    function formatBearing(
        decimalDegrees
    ) {

        const degrees =
            Math.floor(
                decimalDegrees
            );


        const minutesDecimal =
            (
                decimalDegrees -
                degrees
            ) *
            60;


        const minutes =
            Math.floor(
                minutesDecimal
            );


        const seconds =
            (
                minutesDecimal -
                minutes
            ) *
            60;


        return (
            degrees +
            "° " +
            minutes +
            "' " +
            seconds.toFixed(2) +
            '"'
        );

    }


    // ========================================================
    // CLEAR TRAVERSE LINES
    // ========================================================

    function clearTraverseLines() {

        traverseLines.forEach(
            function (
                line
            ) {

                line.setMap(
                    null
                );

            }
        );


        traverseLines =
            [];

    }


    // ========================================================
    // CLEAR TRAVERSE LABELS
    // ========================================================

    function clearTraverseLabels() {

        traverseLabels.forEach(
            function (
                label
            ) {

                label.setMap(
                    null
                );

            }
        );


        traverseLabels =
            [];

    }


    // ========================================================
    // UPDATE STATION LIST
    // ========================================================

    function updateStationList() {

        if (!stationsListElement) {
            return;
        }


        stationsListElement.innerHTML =
            "";


        stationPoints.forEach(
            function (
                point,
                index
            ) {

                const li =
                    document.createElement(
                        "li"
                    );


                const name =
                    document.createElement(
                        "span"
                    );


                name.textContent =
                    point.name;


                const removeButton =
                    document.createElement(
                        "button"
                    );


                removeButton.type =
                    "button";


                removeButton.className =
                    "remove-station-button";


                removeButton.textContent =
                    "✕";


                removeButton.title =
                    "Remove " +
                    point.name;


                removeButton.addEventListener(
                    "click",
                    function (
                        event
                    ) {

                        event.stopPropagation();


                        stationPoints.splice(
                            index,
                            1
                        );


                        updateStationList();

                        updateTraverse();

                    }
                );


                li.appendChild(
                    name
                );


                li.appendChild(
                    removeButton
                );


                stationsListElement.appendChild(
                    li
                );

            }
        );

    }


    // ========================================================
    // UPDATE TRAVERSE
    // ========================================================

    function updateTraverse() {


        clearTraverseLines();

        clearTraverseLabels();


        if (traverseResults) {

            traverseResults.innerHTML =
                "";

        }


        if (
            stationPoints.length ===
            0
        ) {

            if (traverseStatus) {

                traverseStatus.textContent =
                    "No stations added.";

            }

            return;

        }


        if (
            stationPoints.length ===
            1
        ) {

            if (traverseStatus) {

                traverseStatus.textContent =
                    "1 station selected. Tap another control point.";

            }

            return;

        }


        if (traverseStatus) {

            traverseStatus.textContent =
                stationPoints.length +
                " stations selected.";

        }


        // ====================================================
        // CREATE EACH TRAVERSE LEG
        // ====================================================

        for (
            let i = 0;

            i <
            stationPoints.length - 1;

            i++
        ) {

            const from =
                stationPoints[i];


            const to =
                stationPoints[
                    i + 1
                ];


            const distance =
                calculateDistance(
                    from,
                    to
                );


            const bearing =
                calculateBearing(
                    from,
                    to
                );


            const distanceText =
                distance.toFixed(3) +
                " m";


            const bearingText =
                formatBearing(
                    bearing
                );


            // -----------------------------------------------
            // LINE
            // -----------------------------------------------

            const line =
                new google.maps.Polyline({

                    path: [

                        {
                            lat:
                                from.lat,

                            lng:
                                from.lng
                        },

                        {
                            lat:
                                to.lat,

                            lng:
                                to.lng
                        }

                    ],

                    geodesic:
                        false,

                    strokeColor:
                        "#111111",

                    strokeOpacity:
                        0.9,

                    strokeWeight:
                        4,

                    map:
                        map

                });


            traverseLines.push(
                line
            );


            // -----------------------------------------------
            // BEARING + DISTANCE LABEL
            // -----------------------------------------------

            const label =
                new TraverseLabel(
                    from,
                    to,
                    bearingText,
                    distanceText
                );


            label.setMap(
                map
            );


            traverseLabels.push(
                label
            );


            // -----------------------------------------------
            // RESULT CARD
            // -----------------------------------------------

            if (traverseResults) {

                const result =
                    document.createElement(
                        "div"
                    );


                result.className =
                    "traverse-result";


                result.innerHTML =
                    `
                        <div class="traverse-result-header">

                            <strong>
                                ${escapeHTML(
                                    from.name
                                )}
                                →
                                ${escapeHTML(
                                    to.name
                                )}
                            </strong>

                        </div>

                        <br>

                        <strong>
                            Distance:
                        </strong>

                        ${escapeHTML(
                            distanceText
                        )}

                        <br>

                        <strong>
                            Bearing:
                        </strong>

                        ${escapeHTML(
                            bearingText
                        )}
                    `;


                traverseResults.appendChild(
                    result
                );

            }

        }

    }


    // ========================================================
    // ADD STATION / FINISH STATION
    // ========================================================

    addStationButton.addEventListener(
        "click",
        function () {


            // ==================================================
            // TRAVERSE MUST BE ON
            // ==================================================

            if (!traverseMode) {

                alert(
                    "Please turn TRAVERSE ON first."
                );

                return;

            }


            // ==================================================
            // START ADDING STATIONS
            // ==================================================

            if (
                !isAddingStations
            ) {

                isAddingStations =
                    true;


                addStationButton.textContent =
                    "FINISH STATION";


                addStationButton.classList.add(
                    "finish-station-active"
                );


                if (traverseStatus) {

                    traverseStatus.textContent =
                        "Tap control points on the map to add stations.";

                }


                // Make sure station list is visible.
                stationList.style.display =
                    "block";


                return;

            }


            // ==================================================
            // FINISH STATION SELECTION
            // ==================================================

            isAddingStations =
                false;


            // Stop traverse selection mode.
            traverseMode =
                false;


            traverseButton.textContent =
                "TRAVERSE";


            addStationButton.textContent =
                "+ ADD STATION";


            addStationButton.classList.remove(
                "finish-station-active"
            );


            addStationButton.style.display =
                "none";


            // Close station list automatically.
            stationList.style.display =
                "none";


            if (traverseStatus) {

                if (
                    stationPoints.length >=
                    2
                ) {

                    traverseStatus.textContent =
                        stationPoints.length +
                        " stations selected. Traverse finished.";

                } else {

                    traverseStatus.textContent =
                        "Traverse finished.";

                }

            }

        }
    );


    // ========================================================
    // TRAVERSE ON / OFF
    // ========================================================

    if (traverseButton) {

        traverseButton.addEventListener(
            "click",
            function () {


                // ==================================================
                // TURN TRAVERSE ON
                // ==================================================

                if (!traverseMode) {

                    traverseMode =
                        true;


                    isAddingStations =
                        false;


                    traverseButton.textContent =
                        "TRAVERSE ON";


                    addStationButton.style.display =
                        "block";


                    addStationButton.textContent =
                        "+ ADD STATION";


                    addStationButton.classList.remove(
                        "finish-station-active"
                    );


                    stationList.style.display =
                        "block";


                    if (traversePanel) {

                        traversePanel.style.display =
                            "block";

                    }


                    if (traverseStatus) {

                        traverseStatus.textContent =
                            "Press ADD STATION to start selecting stations.";

                    }


                    return;

                }


                // ==================================================
                // TURN TRAVERSE OFF
                // ==================================================

                traverseMode =
                    false;


                isAddingStations =
                    false;


                traverseButton.textContent =
                    "TRAVERSE";


                addStationButton.textContent =
                    "+ ADD STATION";


                addStationButton.classList.remove(
                    "finish-station-active"
                );


                addStationButton.style.display =
                    "none";


                stationList.style.display =
                    "none";


                if (traversePanel) {

                    traversePanel.style.display =
                        "none";

                }

            }
        );

    }


    // ========================================================
    // CLEAR TRAVERSE
    // ========================================================

    if (clearTraverseButton) {

        clearTraverseButton.addEventListener(
            "click",
            function () {


                stationPoints =
                    [];


                selectedPoint =
                    null;


                isAddingStations =
                    false;


                clearTraverseLines();

                clearTraverseLabels();


                updateStationList();


                if (traverseResults) {

                    traverseResults.innerHTML =
                        "";

                }


                if (traverseStatus) {

                    traverseStatus.textContent =
                        "Press ADD STATION to start selecting stations.";

                }


                if (controlPointSelect) {

                    controlPointSelect.value =
                        "";

                }


                addStationButton.textContent =
                    "+ ADD STATION";


                addStationButton.classList.remove(
                    "finish-station-active"
                );

            }
        );

    }


    // ========================================================
    // CREATE CONTROL POINT MARKERS
    // ========================================================

    controlPoints.forEach(
        function (
            point,
            index
        ) {


            // ==================================================
            // CHECK COORDINATES
            // ==================================================

            if (
                !Number.isFinite(
                    point.lat
                ) ||
                !Number.isFinite(
                    point.lng
                )
            ) {

                console.warn(
                    "Invalid coordinates for:",
                    point.name
                );

                return;

            }


            // ==================================================
            // LABEL WIDTH
            // ==================================================

            const labelWidth =
                Math.max(
                    80,
                    (
                        point.name.length *
                        8
                    ) +
                    24
                );


            // ==================================================
            // CUSTOM MARKER
            // NAME + RED PIN
            // ==================================================

            const svg =
                `
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="${labelWidth}"
                        height="76"
                        viewBox="0 0 ${labelWidth} 76"
                    >

                        <!-- CP NAME BOX -->

                        <rect
                            x="2"
                            y="2"
                            width="${labelWidth - 4}"
                            height="32"
                            rx="9"
                            fill="#ffffff"
                            stroke="#1769d1"
                            stroke-width="3"
                        />


                        <!-- CP NAME -->

                        <text
                            x="${labelWidth / 2}"
                            y="23"
                            text-anchor="middle"
                            font-family="Arial, Helvetica, sans-serif"
                            font-size="13"
                            font-weight="700"
                            fill="#123b68"
                        >
                            ${escapeHTML(
                                point.name
                            )}
                        </text>


                        <!-- RED PIN -->

                        <path
                            d="
                                M ${labelWidth / 2} 73

                                C
                                ${labelWidth / 2 - 11} 57,
                                ${labelWidth / 2 - 11} 43,
                                ${labelWidth / 2} 39

                                C
                                ${labelWidth / 2 + 11} 43,
                                ${labelWidth / 2 + 11} 57,
                                ${labelWidth / 2} 73

                                Z
                            "
                            fill="#ea4335"
                        />


                        <!-- WHITE CENTRE -->

                        <circle
                            cx="${labelWidth / 2}"
                            cy="51"
                            r="5"
                            fill="#ffffff"
                        />

                    </svg>
                `;


            const marker =
                new google.maps.Marker({

                    position: {

                        lat:
                            point.lat,

                        lng:
                            point.lng

                    },

                    map:
                        map,

                    title:
                        point.name,

                    optimized:
                        false,

                    zIndex:
                        100 + index,

                    icon: {

                        url:
                            "data:image/svg+xml;charset=UTF-8," +
                            encodeURIComponent(
                                svg
                            ),

                        scaledSize:
                            new google.maps.Size(
                                labelWidth,
                                76
                            ),

                        anchor:
                            new google.maps.Point(
                                labelWidth / 2,
                                76
                            )

                    }

                });


            markers[index] =
                marker;


            // ==================================================
            // MARKER CLICK
            // ==================================================

            marker.addListener(
                "click",
                function () {


                    // ==========================================
                    // THIS CP IS NOW SELECTED
                    // ==========================================

                    selectedPoint =
                        point;


                    // ==========================================
                    // SYNC SEARCH DROPDOWN
                    // ==========================================

                    if (
                        controlPointSelect
                    ) {

                        controlPointSelect.value =
                            String(index);

                    }


                    // ==========================================
                    // DETAILS BUTTON
                    // ==========================================

                    if (detailsButton) {

                        detailsButton.style.display =
                            "block";

                    }

// ==========================================
// ADD STATION MODE
// ==========================================

if (
    traverseMode &&
    isAddingStations
) {

    // --------------------------------------
    // ADD STATION
    // --------------------------------------

    stationPoints.push(
        point
    );


    // --------------------------------------
    // UPDATE STATION LIST
    // --------------------------------------

    updateStationList();


    // --------------------------------------
    // UPDATE TRAVERSE
    // --------------------------------------

    updateTraverse();


    // --------------------------------------
    // STATUS
    // --------------------------------------

    if (traverseStatus) {

        traverseStatus.textContent =
            stationPoints.length +
            " station" +
            (
                stationPoints.length === 1
                    ? ""
                    : "s"
            ) +
            " selected. Tap another control point.";

    }


    // --------------------------------------
    // PAN TO POINT
    // --------------------------------------

    map.panTo({

        lat:
            point.lat,

        lng:
            point.lng

    });


    map.setZoom(
        19
    );


    return;

}
// ==========================================
// NORMAL CONTROL POINT CLICK
// ==========================================

map.panTo({
    lat: point.lat,
    lng: point.lng
});

map.setZoom(19);


// ==========================================
// CLOSE MARKER CLICK FUNCTION
// ==========================================

}
);


// ==========================================
// CLOSE CONTROL POINTS FOREACH
// ==========================================

}
);

    // ========================================================
    // DROPDOWN SEARCH
    // ========================================================

    if (controlPointSelect) {

        controlPointSelect.addEventListener(
            "change",
            function () {


                const index =
                    this.value;


                if (
                    index === ""
                ) {

                    return;

                }


                const point =
                    controlPoints[
                        Number(index)
                    ];


                const marker =
                    markers[
                        Number(index)
                    ];


                if (
                    !point ||
                    !marker
                ) {

                    return;

                }


                selectedPoint =
                    point;


                map.panTo({

                    lat:
                        point.lat,

                    lng:
                        point.lng

                });


                map.setZoom(
                    19
                );


                // If adding stations,
                // dropdown selection also adds CP.
                if (
                    traverseMode &&
                    isAddingStations
                ) {

                    stationPoints.push(
                        point
                    );

                    updateStationList();

                    updateTraverse();

                }

            }
        );

    }


    // ========================================================
    // DETAILS BUTTON
    // ========================================================

    if (detailsButton) {

        detailsButton.addEventListener(
            "click",
            function () {


                if (!selectedPoint) {

                    alert(
                        "Please select a control point on the map first."
                    );

                    return;

                }


                showControlPointDetails(
                    selectedPoint
                );

            }
        );

    }


    // ========================================================
    // MY LOCATION
    // ========================================================

    let userLocationMarker =
        null;


    let userLocationAccuracyCircle =
        null;


    if (locationButton) {

        locationButton.addEventListener(
            "click",
            function () {


                if (
                    !navigator.geolocation
                ) {

                    alert(
                        "Your browser does not support location services."
                    );

                    return;

                }


                locationButton.disabled =
                    true;


                locationButton.textContent =
                    "📍 Locating...";


                navigator.geolocation.getCurrentPosition(

                    function (
                        position
                    ) {


                        const userLocation = {

                            lat:
                                position.coords.latitude,

                            lng:
                                position.coords.longitude

                        };


                        const accuracy =
                            position.coords.accuracy;


                        // ======================================
                        // REMOVE OLD LOCATION
                        // ======================================

                        if (
                            userLocationMarker
                        ) {

                            userLocationMarker.setMap(
                                null
                            );

                        }


                        if (
                            userLocationAccuracyCircle
                        ) {

                            userLocationAccuracyCircle.setMap(
                                null
                            );

                        }


                        // ======================================
                        // BLUE LOCATION MARKER
                        // ======================================

                        userLocationMarker =
                            new google.maps.Marker({

                                position:
                                    userLocation,

                                map:
                                    map,

                                title:
                                    "My Location",

                                zIndex:
                                    9999,

                                icon: {

                                    path:
                                        google.maps.SymbolPath.CIRCLE,

                                    scale:
                                        9,

                                    fillColor:
                                        "#1769d1",

                                    fillOpacity:
                                        1,

                                    strokeColor:
                                        "#ffffff",

                                    strokeWeight:
                                        3

                                }

                            });


                        // ======================================
                        // ACCURACY CIRCLE
                        // ======================================

                        userLocationAccuracyCircle =
                            new google.maps.Circle({

                                map:
                                    map,

                                center:
                                    userLocation,

                                radius:
                                    accuracy,

                                fillColor:
                                    "#1769d1",

                                fillOpacity:
                                    0.12,

                                strokeColor:
                                    "#1769d1",

                                strokeOpacity:
                                    0.45,

                                strokeWeight:
                                    1,

                                clickable:
                                    false

                            });


                        // ======================================
                        // MOVE MAP
                        // ======================================

                        map.panTo(
                            userLocation
                        );


                        map.setZoom(
                            19
                        );


                        locationButton.disabled =
                            false;


                        locationButton.textContent =
                            "📍 My Location";

                    },


                    function (
                        error
                    ) {


                        console.error(
                            "Geolocation error:",
                            error
                        );


                        locationButton.disabled =
                            false;


                        locationButton.textContent =
                            "📍 My Location";


                        if (
                            error.code ===
                            error.PERMISSION_DENIED
                        ) {

                            alert(
                                "Location permission was denied."
                            );

                        } else if (
                            error.code ===
                            error.POSITION_UNAVAILABLE
                        ) {

                            alert(
                                "Your current location could not be determined."
                            );

                        } else if (
                            error.code ===
                            error.TIMEOUT
                        ) {

                            alert(
                                "Getting your location took too long. Please try again."
                            );

                        } else {

                            alert(
                                "Unable to get your current location."
                            );

                        }

                    },


                    {
                        enableHighAccuracy:
                            true,

                        timeout:
                            15000,

                        maximumAge:
                            0
                    }

                );

            }
        );

    }


    // ========================================================
    // MAP READY
    // ========================================================

    console.log(
        "===================================="
    );


    console.log(
        "InterSurv map ready."
    );


    console.log(
        "Control points:",
        controlPoints.length
    );


    console.log(
        "Markers:",
        markers.length
    );


    console.log(
        "===================================="
    );

}


// ============================================================
// MAKE initMap AVAILABLE TO GOOGLE MAPS
// ============================================================

window.initMap =
    initMap;