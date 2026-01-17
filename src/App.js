const { useState, useRef } = React;

const App = () => {
    const [screen, setScreen] = useState('home'); 
    const [modalOpen, setModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState(null); 
    
    const [message, setMessage] = useState("");
    const [imageLoaded, setImageLoaded] = useState(false);
    const canvasRef = useRef(null);

    // --- THE SECRET SIGNATURE ---
    // This acts like a header so we know if the image is actually hacked.
    const SIGNATURE = "ROBO_SECURE::"; 

    const goHome = () => {
        setScreen('home');
        setImageLoaded(false);
        setMessage("");
        setModalOpen(false);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = canvasRef.current;
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                setImageLoaded(true);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    // --- ENCRYPTION LOGIC (UPDATED) ---
    const handleHack = () => {
        if (!imageLoaded || !message) return alert("SYSTEM ERROR: Missing Input");

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // 1. Add the Signature BEFORE the message
        const fullPayload = SIGNATURE + message;

        let binary = "";
        for (let i = 0; i < fullPayload.length; i++) {
            binary += fullPayload.charCodeAt(i).toString(2).padStart(8, '0');
        }
        binary += "00000000"; // Terminator

        if (binary.length > data.length / 4) return alert("OVERFLOW: Text too long");

        for (let i = 0; i < binary.length; i++) {
            const pixelIndex = i * 4;
            const blue = data[pixelIndex + 2];
            const bit = parseInt(binary[i]);
            if (blue % 2 === 0 && bit === 1) data[pixelIndex + 2] += 1;
            else if (blue % 2 === 1 && bit === 0) data[pixelIndex + 2] -= 1;
        }

        ctx.putImageData(imgData, 0, 0);

        setModalContent({
            title: "INJECTION COMPLETE",
            body: (
                <div style={{textAlign:'center'}}>
                    <p>Payload embedded with security signature.</p>
                    <a 
                        href={canvas.toDataURL()} 
                        download="hacked_image.png"
                        className="robo-btn"
                        style={{marginTop: '15px'}}
                    >
                        DOWNLOAD ARTIFACT
                    </a>
                </div>
            )
        });
        setModalOpen(true);
    };

    // --- DECRYPTION LOGIC (UPDATED) ---
    const handleRestore = () => {
        if (!imageLoaded) return alert("SYSTEM ERROR: No Image");
        const ctx = canvasRef.current.getContext('2d');
        const data = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height).data;
        let binary = "";
        let decodedText = "";

        // Read Bits
        for (let i = 0; i < data.length; i += 4) {
            binary += (data[i + 2] % 2);
        }

        // Convert to Text
        for (let i = 0; i < binary.length; i += 8) {
            const byte = binary.slice(i, i + 8);
            if (byte === "00000000") break;
            decodedText += String.fromCharCode(parseInt(byte, 2));
        }

        // 2. CHECK FOR SIGNATURE
        // If the text does NOT start with "ROBO_SECURE::", it's just noise.
        let resultBody;

        if (decodedText.startsWith(SIGNATURE)) {
            // Success: Remove the signature and show the message
            const realMessage = decodedText.replace(SIGNATURE, "");
            resultBody = (
                <div>
                    <p style={{color:'lime'}}>// SIGNATURE MATCHED</p>
                    <div style={{
                        border:'1px solid lime', 
                        padding:'10px', 
                        color:'white', 
                        background:'#002200',
                        fontSize:'1.1rem',
                        wordBreak: 'break-all',
                        fontFamily: 'Courier New'
                    }}>
                        {realMessage}
                    </div>
                </div>
            );
        } else {
            // Failure: It's just a normal image
            resultBody = (
                <div style={{textAlign: 'center'}}>
                    <p style={{color:'red', fontWeight:'bold', fontSize:'1.2rem'}}>
                        // NO DATA DETECTED
                    </p>
                    <p style={{color:'#888', fontSize:'0.9rem'}}>
                        This image appears clean. No hidden payload found.
                    </p>
                </div>
            );
        }

        setModalContent({
            title: "SCAN COMPLETE",
            body: resultBody
        });
        setModalOpen(true);
    };

    return (
        <div className="container">
            {screen === 'home' && (
                <div className="home-screen">
                    <h1 className="title-glitch">STEGA_VAULT v4.0</h1>
                    <div className="button-group">
                        <button className="robo-btn" onClick={() => setScreen('encode')}>
                            INJECT PAYLOAD
                        </button>
                        <button className="robo-btn danger" onClick={() => setScreen('decode')}>
                            EXTRACT DATA
                        </button>
                    </div>
                </div>
            )}

            {screen === 'encode' && (
                <div className="workspace">
                    <button className="back-btn" onClick={goHome}>&lt; ABORT MISSION</button>
                    <h2>// INITIALIZE INJECTION</h2>
                    
                    <p>1. UPLOAD HOST IMAGE</p>
                    <input type="file" onChange={handleImageUpload} accept="image/*" />
                    
                    <p>2. ENTER SECRET PAYLOAD</p>
                    <textarea 
                        rows="4" 
                        placeholder="Type classified data..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    ></textarea>

                    <button className="robo-btn" onClick={handleHack} style={{width:'100%', marginTop:'20px'}}>
                        EXECUTE PROTOCOL
                    </button>
                </div>
            )}

            {screen === 'decode' && (
                <div className="workspace" style={{borderColor:'var(--secondary)'}}>
                    <button className="back-btn" onClick={goHome}>&lt; ABORT MISSION</button>
                    <h2 style={{color:'var(--secondary)'}}>// DATA EXTRACTION</h2>
                    
                    <p>1. UPLOAD ARTIFACT</p>
                    <input type="file" onChange={handleImageUpload} accept="image/*" />

                    <button className="robo-btn danger" onClick={handleRestore} style={{width:'100%', marginTop:'20px'}}>
                        ANALYZE & DECRYPT
                    </button>
                </div>
            )}

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {modalOpen && (
                <div className="modal-overlay">
                    <div className="modal-window">
                        <div className="modal-header">
                            <span>{modalContent.title}</span>
                            <span className="close-x" onClick={() => setModalOpen(false)}>X</span>
                        </div>
                        <div className="modal-body">
                            {modalContent.body}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
