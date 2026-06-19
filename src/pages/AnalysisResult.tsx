const handleGeneratePdf = async () => {
    const element = reportRef.current;
    if (!element) return;

    setIsGeneratingPdf(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 14;
      const contentWidth = pageWidth - margin * 2;
      let cursorY = margin;

      const hexToRgb = (hex: string) => {
        const normalized = hex.replace('#', '').trim();
        const value =
          normalized.length === 3
            ? normalized
                .split('')
                .map((char) => char + char)
                .join('')
            : normalized.padEnd(6, '0').slice(0, 6);

        return [
          Number.parseInt(value.slice(0, 2), 16) || 0,
          Number.parseInt(value.slice(2, 4), 16) || 0,
          Number.parseInt(value.slice(4, 6), 16) || 0,
        ] as const;
      };

      const applyBackground = () => {
        const [r, g, b] = hexToRgb(pdfBgColor);
        pdf.setFillColor(r, g, b);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      };

      const setPdfColor = (hex: string) => {
        const [r, g, b] = hexToRgb(hex);
        pdf.setTextColor(r, g, b);
      };

      const newPage = () => {
        pdf.addPage();
        applyBackground();
        cursorY = margin;
      };

      const ensureSpace = (neededHeight: number) => {
        if (cursorY + neededHeight > pageHeight - margin) {
          newPage();
        }
      };

      const loadImageData = async (src: string | null | undefined) => {
        if (!src) return '';

        const settled = await Promise.allSettled([
          withTimeout(fetchImageAsDataUrl(getPdfSafeImageSrc(src)), 6000, ''),
        ]);

        const result = settled[0];
        return result.status === 'fulfilled' ? result.value : '';
      };

      const addSectionTitle = (title: string) => {
        ensureSpace(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        setPdfColor('#1C3A2B');
        pdf.text(title, margin, cursorY);
        cursorY += 6;
      };

      const addParagraph = (text: string, fontSize = 9.5, color = '#1C3A2B') => {
        if (!text) return;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(fontSize);
        setPdfColor(color);
        const lines = pdf.splitTextToSize(text, contentWidth);
        const height = lines.length * 4.3;
        ensureSpace(height);
        pdf.text(lines, margin, cursorY);
        cursorY += height + 2;
      };

      const addKeyValue = (label: string, value: unknown, color = '#1C3A2B') => {
        const text = textValue(value);
        if (!text) return;

        ensureSpace(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9.5);
        setPdfColor('#1C3A2B');
        pdf.text(`${label}:`, margin, cursorY);
        cursorY += 4;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9.2);
        setPdfColor(color);
        const lines = pdf.splitTextToSize(text, contentWidth);
        const height = lines.length * 4.2;
        ensureSpace(height);
        pdf.text(lines, margin, cursorY);
        cursorY += height + 2;
      };

      const addDivider = () => {
        ensureSpace(4);
        pdf.setDrawColor(212, 201, 181);
        pdf.line(margin, cursorY, pageWidth - margin, cursorY);
        cursorY += 4;
      };

      const addImageCard = async (
        label: string,
        src: string | null,
        x: number,
        y: number,
        width: number,
        height: number,
      ) => {
        const data = await loadImageData(src);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        setPdfColor('#4A7A5C');
        pdf.text(label, x, y - 2);

        pdf.setFillColor(245, 240, 232);
        pdf.setDrawColor(212, 201, 181);
        pdf.roundedRect(x, y, width, height, 4, 4, 'FD');

        if (data) {
          const props = pdf.getImageProperties(data);
          const aspect = props.width / props.height;

          let drawW = width - 4;
          let drawH = drawW / aspect;

          if (drawH > height - 4) {
            drawH = height - 4;
            drawW = drawH * aspect;
          }

          const drawX = x + (width - drawW) / 2;
          const drawY = y + (height - drawH) / 2;

          pdf.addImage(
            data,
            (props.fileType || 'JPEG').toUpperCase(),
            drawX,
            drawY,
            drawW,
            drawH,
            undefined,
            'FAST',
          );
        }
      };

      applyBackground();

      if (pdfLogo) {
        const logoData = await loadImageData(pdfLogo);
        if (logoData) {
          const props = pdf.getImageProperties(logoData);
          const logoWidth = 36;
          const logoHeight = (props.height / props.width) * logoWidth;

          ensureSpace(logoHeight + 8);

          pdf.addImage(
            logoData,
            (props.fileType || 'PNG').toUpperCase(),
            (pageWidth - logoWidth) / 2,
            cursorY,
            logoWidth,
            logoHeight,
            undefined,
            'FAST',
          );
          cursorY += logoHeight + 6;
        }
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      setPdfColor('#1C3A2B');
      pdf.text(
        analysis.isComparativo ? 'Relatório de Evolução' : isTricoscopia ? 'Relatório Tricoscópico' : 'Relatório Técnico',
        pageWidth / 2,
        cursorY,
        { align: 'center' },
      );
      cursorY += 7;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      setPdfColor('#4A7A5C');
      pdf.text('Tricologia de Sobrancelhas', pageWidth / 2, cursorY, { align: 'center' });
      cursorY += 8;

      addDivider();

      if (analysis.isComparativo && hasTwoImages) {
        addSectionTitle('Imagens da análise');

        const boxWidth = (contentWidth - 6) / 2;
        const boxHeight = 68;
        ensureSpace(boxHeight + 14);

        const beforeData = await loadImageData(displayBeforeImage);
        const afterData = await loadImageData(displayAfterImage);
        const imageY = cursorY + 4;

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        setPdfColor('#4A7A5C');
        pdf.text('Antes', margin, cursorY);
        pdf.text('Depois', margin + boxWidth + 6, cursorY);

        await addImageCard('Antes', beforeData || displayBeforeImage || '', margin, imageY, boxWidth, boxHeight);
        await addImageCard('Depois', afterData || displayAfterImage || '', margin + boxWidth + 6, imageY, boxWidth, boxHeight);
        cursorY = imageY + boxHeight + 6;
      } else {
        addSectionTitle('Imagem principal');

        const boxHeight = 120;
        ensureSpace(boxHeight + 10);

        const imageData = await loadImageData(displayImage);
        pdf.setFillColor(245, 240, 232);
        pdf.setDrawColor(212, 201, 181);
        pdf.roundedRect(margin, cursorY, contentWidth, boxHeight, 6, 6, 'FD');

        if (imageData) {
          const props = pdf.getImageProperties(imageData);
          const aspect = props.width / props.height;

          let drawW = contentWidth - 4;
          let drawH = drawW / aspect;

          if (drawH > boxHeight - 4) {
            drawH = boxHeight - 4;
            drawW = drawH * aspect;
          }

          pdf.addImage(
            imageData,
            (props.fileType || 'JPEG').toUpperCase(),
            margin + (contentWidth - drawW) / 2,
            cursorY + (boxHeight - drawH) / 2,
            drawW,
            drawH,
            undefined,
            'FAST',
          );
        }

        cursorY += boxHeight + 6;
      }

      if (analysis.isComparativo && analysis.comparativo) {
        addSectionTitle('Análise de evolução');
        addParagraph(analysis.comparativo.evolucaoGeral, 10, '#1C3A2B');

        ensureSpace(18);
        pdf.setFillColor(28, 58, 43);
        pdf.roundedRect(margin, cursorY, contentWidth, 14, 4, 4, 'F');
        setPdfColor('#E8DECE');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.text(`+${analysis.comparativo.melhoriaPercentualEstimada}% Melhoria`, margin + 4, cursorY + 9);
        cursorY += 17;

        addKeyValue('Destaque positivo', analysis.comparativo.destaquePositivo, '#1C3A2B');
      }

      if (analysis.alertaInterno?.presente) {
        addSectionTitle('Alerta de fator interno');
        addParagraph(analysis.alertaInterno.descricao, 10, '#3B6D11');
      }

      if (isTricoscopia) {
        addSectionTitle('Região analisada');
        addParagraph(textValue(analysis.regiaoAnalisada), 10);

        addSectionTitle('Análise da pele');
        addKeyValue('Conclusão', analysis.analiseDaPele?.conclusao);
        addKeyValue('Descamação interfolicular', analysis.analiseDaPele?.descamacaoInterfolicular);
        addKeyValue('Descamação perifolicular', analysis.analiseDaPele?.descamacaoPerifolicular);
        addKeyValue('Coloração da descamação', analysis.analiseDaPele?.coloracaoDescamacao);
        addKeyValue('Sinais de procedimentos agressivos', analysis.analiseDaPele?.sinaisProcedimentosAgressivos);

        addSectionTitle('Análise dos fios');
        addKeyValue('Referência', analysis.analiseDosFios?.fioReferencia);
        addKeyValue('Classificação', analysis.analiseDosFios?.classificacaoFiosPresentes);
        addKeyValue('Pigmentação', analysis.analiseDosFios?.pigmentacao);
        addKeyValue('Quantidade e distribuição', analysis.analiseDosFios?.quantidadeDistribuicao);

        addSectionTitle('Óstios foliculares');
        addKeyValue('Óstio vazio', analysis.analiseDosOstiosFoliculares?.ostioVazio);
        addKeyValue('Óstio com fio', analysis.analiseDosOstiosFoliculares?.ostioComFio);
        addKeyValue('Presença de sebo', analysis.analiseDosOstiosFoliculares?.presencaSebo);
        addKeyValue('Atrofia ou cicatriz folicular', analysis.analiseDosOstiosFoliculares?.atrofiaOuCicatrizFolicular);

        addSectionTitle('Conclusão tricoscópica');
        addKeyValue('Estado geral', analysis.conclusaoTricoscopica?.estadoGeral);
        addKeyValue('Principais achados', analysis.conclusaoTricoscopica?.principaisAchados);
        addKeyValue('Indicadores positivos', analysis.conclusaoTricoscopica?.indicadoresPositivos);
        addKeyValue('Pontos de atenção', analysis.conclusaoTricoscopica?.pontosDeAtencao);
        addKeyValue('Correlação com a análise visual', analysis.conclusaoTricoscopica?.correlacaoAnaliseVisual);
      } else {
        for (const [key, data] of regionEntries as [string, any][]) {
          const labelMap: Record<string, string> = {
            inicio: 'Ponto Inicial',
            meio: 'Meio da Sobrancelha',
            cauda: 'Cauda da Sobrancelha',
          };

          addSectionTitle(labelMap[key] || key);
          addKeyValue('Densidade', `${data.densidade?.classificacao || 'Não informada'} (${data.densidade?.percentual ?? 0}%)`);
          addParagraph(data.descricao, 9.5);
          addKeyValue('Espessura', data.espessura);
          addKeyValue('Pele exposta', data.peleExposta ? 'Sim' : 'Não');
          addKeyValue('Exposição da pele', data.peleDescricao);
          addKeyValue('Direção dos fios', data.direcaoFios);
          addKeyValue('Características dos fios', data.caracteristicasEspeciais);
          addKeyValue('Prognóstico', data.prognostico);
          addKeyValue('Status de melhoria', data.statusMelhoria?.descricao);
          addDivider();
        }

        addSectionTitle('Visão geral e objetivo');
        addParagraph(analysis.visaoGeral?.descricao, 10);
        addKeyValue('Objetivo', analysis.visaoGeral?.objetivo);
      }

      pdf.save(`relatorio-diagnostico-${analysis.isComparativo ? 'evolucao' : 'tecnico'}.pdf`);
      showSuccess('Relatório PDF gerado com sucesso!');
    } finally {
      setIsGeneratingPdf(false);
    }
  };