import React, { useRef, useState, useEffect } from "react";
import Moveable from "react-moveable";
import "./styles.css"

const App = () => {
  const [moveableComponents, setMoveableComponents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [parentBounds, setParentBounds] = useState(null);

  const addMoveable = async () => {
    const COLORS = ["red", "blue", "yellow", "green", "purple"];

    try {
      const response = await fetch("https://jsonplaceholder.typicode.com/photos");
      const data = await response.json();

      const randomIndex = Math.floor(Math.random() * data.length);
      const { url } = data[randomIndex];

      setMoveableComponents((prevComponents) => [
        ...prevComponents,
        {
          id: Math.floor(Math.random() * Date.now()),
          top: 0,
          left: 0,
          width: 100,
          height: 100,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          image: url,
          updateEnd: true,
        },
      ]);
    } catch (error) {
      console.error("Error fetching image:", error);
    }
  };

  const updateMoveable = (id, newComponent, updateEnd = false) => {
    const updatedMoveables = moveableComponents.map((moveable) => {
      if (moveable.id === id) {
        const { top, left, width, height } = newComponent;

        // Obtener los límites del contenedor
        const containerWidth = parentBounds?.width || 0;
        const containerHeight = parentBounds?.height || 0;

        // Ajustar las coordenadas si exceden los límites del contenedor
        let adjustedTop = top;
        let adjustedLeft = left;

        if (adjustedTop < 0) {
          adjustedTop = 0;
        } else if (adjustedTop + height > containerHeight) {
          adjustedTop = containerHeight - height;
        }

        if (adjustedLeft < 0) {
          adjustedLeft = 0;
        } else if (adjustedLeft + width > containerWidth) {
          adjustedLeft = containerWidth - width;
        }

        return { id, ...newComponent, top: adjustedTop, left: adjustedLeft, updateEnd };
      }
      return moveable;
    });
    setMoveableComponents(updatedMoveables);
  };

  const handleResizeStart = (index, e) => {
    const [handlePosX] = e.direction;

    if (handlePosX === -1) {
      const initialLeft = e.left;
      const initialWidth = e.width;

      e.set([0, 0]); // Reset the left value during resizing

      e.drag.on("end", ({ isDrag }) => {
        if (!isDrag) {
          const diffWidth = e.width - initialWidth;
          const newLeft = initialLeft - diffWidth;

          updateMoveable(index, {
            top: e.top,
            left: newLeft,
            width: e.width,
            height: e.height,
            color: e.color,
          });
        }
      });
    }
  };

  const handleDelete = (id) => {
    const updatedMoveables = moveableComponents.filter((moveable) => moveable.id !== id);
    setMoveableComponents(updatedMoveables);
    if (selected === id) {
      setSelected(null);
    }
  };

  useEffect(() => {
    const handleWindowClick = () => {
      setSelected(null);
    };

    window.addEventListener("click", handleWindowClick);

    return () => {
      window.removeEventListener("click", handleWindowClick);
    };
  }, []);

  useEffect(() => {
    const parentElement = document.getElementById("parent");
    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setParentBounds({ width, height });
    });
    resizeObserver.observe(parentElement);

    return () => {
      resizeObserver.unobserve(parentElement);
    };
  }, []);

  return (
    <main style={{ height: "100vh", width: "100vw" }}>
      <button onClick={addMoveable} className="button">Add Moveable</button>
      <div
        id="parent"
        style={{
          position: "relative",
          background: "black",
          height: "80vh",
          width: "80vw",
        }}
      >
        {moveableComponents.map((item, index) => (
          <Component
            {...item}
            key={item.id}
            index={index}
            updateMoveable={updateMoveable}
            handleResizeStart={handleResizeStart}
            setSelected={setSelected}
            isSelected={selected === item.id}
            handleDelete={handleDelete}
            parentBounds={parentBounds}
          />
        ))}
      </div>
    </main>
  );
};

const Component = ({
  updateMoveable,
  top,
  left,
  width,
  height,
  index,
  color,
  id,
  image,
  setSelected,
  isSelected = false,
  updateEnd,
  handleDelete,
  parentBounds,
}) => {
  const ref = useRef();

  const onResize = (e) => {
    let newWidth = e.width;
    let newHeight = e.height;

    const positionMaxTop = top + newHeight;
    const positionMaxLeft = left + newWidth;

    if (positionMaxTop > parentBounds?.height) {
      newHeight = parentBounds?.height - top;
    }
    if (positionMaxLeft > parentBounds?.width) {
      newWidth = parentBounds?.width - left;
    }

    updateMoveable(id, {
      top,
      left,
      width: newWidth,
      height: newHeight,
      color,
      image,
    });
  };

  const onResizeEnd = (e) => {
    let newWidth = e.lastEvent?.width;
    let newHeight = e.lastEvent?.height;

    const positionMaxTop = top + newHeight;
    const positionMaxLeft = left + newWidth;

    if (positionMaxTop > parentBounds?.height) {
      newHeight = parentBounds?.height - top;
    }
    if (positionMaxLeft > parentBounds?.width) {
      newWidth = parentBounds?.width - left;
    }

    const { lastEvent } = e;
    const { drag } = lastEvent;
    const { beforeTranslate } = drag;

    const absoluteTop = top + beforeTranslate[1];
    const absoluteLeft = left + beforeTranslate[0];

    updateMoveable(id, {
      top: absoluteTop,
      left: absoluteLeft,
      width: newWidth,
      height: newHeight,
      color,
      image,
    }, true);
  };

  return (
    <>
      <div
        ref={ref}
        className="draggable"
        id={"component-" + id}
        style={{
          position: "absolute",
          top: top,
          left: left,
          width: width,
          height: height,
          background: color,
          backgroundImage: `url(${image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        onClick={(e) => {
          e.stopPropagation();
          setSelected(id);
        }}
      />
      <button onClick={() => handleDelete(id)} className="Delete">Delete</button>
      {isSelected && (
        <Moveable
          target={ref.current}
          resizable
          draggable
          onDrag={(e) => {
            updateMoveable(id, {
              top: e.top,
              left: e.left,
              width,
              height,
              color,
              image,
            });
          }}
          onResize={onResize}
          onResizeEnd={onResizeEnd}
          keepRatio={false}
          throttleResize={1}
          renderDirections={["nw", "n", "ne", "w", "e", "sw", "s", "se"]}
          edge={false}
          zoom={1}
          origin={false}
          padding={{ left: 0, top: 0, right: 0, bottom: 0 }}
        />
      )}
    </>
  );
};

export default App;
