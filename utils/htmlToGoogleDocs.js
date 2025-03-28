import { parseDocument } from "htmlparser2";

export const parseHTMLToGoogleDocs = (htmlContent) => {
  if (!htmlContent || htmlContent.trim() === "") {
    return [{ insertText: { location: { index: 1 }, text: "Empty document" } }];
  }

  const doc = parseDocument(htmlContent);
  const requests = [];
  let index = 1;
  let listLevel = 0;
  let listCounter = 1;
  let listType = null;

  const processNode = (node, parentTag = null) => {
    if (node.type === "text") {
      requests.push({
        insertText: {
          location: { index },
          text: node.data,
        },
      });
      index += node.data.length;
    } else if (node.type === "tag") {
      const startIndex = index;

      if (node.name === "ul" || node.name === "ol") {
        listLevel++;
        listType = node.name;
        listCounter = 1;
      }

      if (node.name === "li") {
        const bullet = listType === "ol" ? `${listCounter}. ` : "• ";
        requests.push({
          insertText: { location: { index }, text: `\n${bullet}` },
        });
        index += bullet.length + 1;
        if (listType === "ol") listCounter++;
      }

      node.children?.forEach((child) => processNode(child, node.name));

      const endIndex = index;

      const styleMap = {
        b: { bold: true },
        strong: { bold: true },
        i: { italic: true },
        em: { italic: true },
        u: { underline: true },
        s: { strikethrough: true },
      };

      if (styleMap[node.name]) {
        requests.push({
          updateTextStyle: {
            range: { startIndex, endIndex },
            textStyle: styleMap[node.name],
            fields: Object.keys(styleMap[node.name]).join(","),
          },
        });
      } else if (node.name.startsWith("h") && node.name.length === 2) {
        const level = node.name[1];
        requests.push({
          updateParagraphStyle: {
            range: { startIndex, endIndex },
            paragraphStyle: { namedStyleType: `HEADING_${level}` },
            fields: "namedStyleType",
          },
        });
      } else if (node.name === "p") {
        requests.push({
          insertText: { location: { index }, text: "\n" },
        });
        index += 1;
      }

      if (node.name === "ul" || node.name === "ol") {
        listLevel--;
        if (listLevel === 0) listType = null;
      }
    }
  };

  doc.children.forEach(processNode);

  if (requests.length === 0) {
    requests.push({
      insertText: { location: { index: 1 }, text: "No valid content" },
    });
  }

  return requests;
};
