document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const imageUpload = document.getElementById('imageUpload');
    const bgColorPicker = document.getElementById('bgColor');
    const sizeSelect = document.getElementById('sizeSelect');
    const previewList = document.getElementById('previewList');
    const canvasInfo = document.getElementById('canvasInfo');

    let images = [];
    let particles = [];
    let canvasBackgroundColor = '#FFD700';

    const controls = {
        pattern: 'spiral',
        largeSize: 80,
        smallSize: 40,
        gridSpacing: 100
    };

    class Particle {
        constructor(image, imageId, isLarge = false) {
            this.image = image;
            this.imageId = imageId;
            this.isLarge = isLarge;
            this.size = isLarge ? controls.largeSize : controls.smallSize;
            this.reset();
        }

        reset() {
            switch (controls.pattern) {
                case 'spiral':
                    this.setupSpiral();
                    break;
                case 'random':
                    this.setupRandom();
                    break;
                case 'float':
                    this.setupFloat();
                    break;
            }
        }

        setupSpiral() {
            const index = particles.indexOf(this);
            const totalParticles = particles.length;
            
            const maxRadius = Math.min(canvas.width, canvas.height) * 0.45;
            const spiralTightness = 0.3;
            
            const angle = index * spiralTightness;
            const radius = (angle / (Math.PI * 2)) * 30;
            
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
            this.x = centerX + Math.cos(angle) * radius;
            this.y = centerY + Math.sin(angle) * radius;
            
            this.size = this.isLarge ? controls.largeSize : controls.smallSize;
            this.rotation = angle;
            
            delete this.speedX;
            delete this.speedY;
            delete this.rotationSpeed;
        }

        setupRandom() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.rotation = Math.random() * Math.PI * 2;
        }

        setupFloat() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.speedX = (-1 + Math.random() * 2) * 0.5;
            this.speedY = (-1 + Math.random() * 2) * 0.5;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (-1 + Math.random() * 2) * 0.02;
        }

        update() {
            if (controls.pattern === 'float') {
                this.x += this.speedX;
                this.y += this.speedY;
                this.rotation += this.rotationSpeed;

                if (this.x < -this.size) this.x = canvas.width + this.size;
                if (this.x > canvas.width + this.size) this.x = -this.size;
                if (this.y < -this.size) this.y = canvas.height + this.size;
                if (this.y > canvas.height + this.size) this.y = -this.size;
            }
        }

        draw() {
            if (!this.image) return;
            
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.drawImage(
                this.image, 
                -this.size / 2, 
                -this.size / 2, 
                this.size, 
                this.size
            );
            ctx.restore();
        }
    }

    function resetParticles() {
        particles = [];
        if (images.length === 0) return;

        const totalParticles = Math.floor((canvas.width + canvas.height) / 15);
        
        for (let i = 0; i < totalParticles; i++) {
            const image = images[i % images.length];
            particles.push(new Particle(image, image.imageId, i % 3 === 0));
        }
    }

    // 创建 Emoji 图片
    async function createEmojiImage(emoji) {
        const canvas = document.createElement('canvas');
        const size = 200; // 画布大小
        canvas.width = size;
        canvas.height = size;
        
        const ctx = canvas.getContext('2d');
        
        // 清除画布
        ctx.clearRect(0, 0, size, size);
        
        // 设置文本属性
        const fontSize = size * 0.8; // 增大字体尺寸
        ctx.font = `${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", Arial`;
        
        // 测量文本尺寸
        const metrics = ctx.measureText(emoji);
        const actualHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
        
        // 计算精确的居中位置
        const x = size / 2;
        const y = (size / 2) + (actualHeight / 8); // 微调垂直位置
        
        // 设置文本绘制属性
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 绘制 emoji
        ctx.fillText(emoji, x, y);
        
        const img = new Image();
        await new Promise(resolve => {
            img.onload = () => {
                img.imageId = `emoji_${Date.now()}`;
                resolve();
            };
            img.src = canvas.toDataURL();
        });
        
        return img;
    }

    // 添加 Emoji
    async function addEmoji(emoji) {
        const img = await createEmojiImage(emoji);
        images.push(img);
        updatePreviewList();
        resetParticles();
    }

    // 事件监听器
    document.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            addEmoji(btn.textContent);
        });
    });

    const emojiInput = document.getElementById('emojiInput');
    const addEmojiBtn = document.getElementById('addEmojiBtn');

    addEmojiBtn.addEventListener('click', () => {
        const emoji = emojiInput.value.trim();
        if (emoji) {
            addEmoji(emoji);
            emojiInput.value = '';
        }
    });

    emojiInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const emoji = emojiInput.value.trim();
            if (emoji) {
                addEmoji(emoji);
                emojiInput.value = '';
            }
        }
    });

    imageUpload.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.imageId = `img_${Date.now()}`;
                img.onload = () => {
                    images.push(img);
                    updatePreviewList();
                    resetParticles();
                };
            };
            reader.readAsDataURL(file);
        });
        imageUpload.value = '';
    });

    function addPreviewImage(img, index) {
        const div = document.createElement('div');
        div.className = 'preview-item';
        const preview = document.createElement('img');
        preview.src = img.src;
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.onclick = () => deleteImage(index);
        div.appendChild(preview);
        div.appendChild(deleteBtn);
        previewList.appendChild(div);
    }

    function deleteImage(index) {
        images.splice(index, 1);
        updatePreviewList();
        resetParticles();
    }

    function updatePreviewList() {
        previewList.innerHTML = '';
        images.forEach((img, index) => addPreviewImage(img, index));
    }

    bgColorPicker.addEventListener('change', (e) => {
        canvasBackgroundColor = e.target.value;
    });

    document.getElementById('patternSelect').addEventListener('change', (e) => {
        controls.pattern = e.target.value;
        resetParticles();
    });

    sizeSelect.addEventListener('change', resizeCanvas);

    function resizeCanvas() {
        const [width, height] = sizeSelect.value.split('x').map(Number);
        canvas.width = width;
        canvas.height = height;
        canvasInfo.textContent = `${width} x ${height}`;
        resetParticles();
    }

    function animate() {
        ctx.fillStyle = canvasBackgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        requestAnimationFrame(animate);
    }

    resizeCanvas();
    animate();

    // 添加尺寸和间距控制
    const largeSizeInput = document.getElementById('largeSize');
    const smallSizeInput = document.getElementById('smallSize');
    const gridSpacingInput = document.getElementById('gridSpacing');
    const largeSizeValue = document.getElementById('largeSizeValue');
    const smallSizeValue = document.getElementById('smallSizeValue');
    const gridSpacingValue = document.getElementById('gridSpacingValue');

    // 更新显示值
    function updateDisplayValues() {
        largeSizeValue.textContent = `${controls.largeSize}px`;
        smallSizeValue.textContent = `${controls.smallSize}px`;
        gridSpacingValue.textContent = `${controls.gridSpacing}px`;
    }

    // 添加事件监听器
    largeSizeInput.addEventListener('input', (e) => {
        controls.largeSize = parseInt(e.target.value);
        updateDisplayValues();
        resetParticles();
    });

    smallSizeInput.addEventListener('input', (e) => {
        controls.smallSize = parseInt(e.target.value);
        updateDisplayValues();
        resetParticles();
    });

    gridSpacingInput.addEventListener('input', (e) => {
        controls.gridSpacing = parseInt(e.target.value);
        updateDisplayValues();
        resetParticles();
    });

    // 初始化显示值
    updateDisplayValues();
});
