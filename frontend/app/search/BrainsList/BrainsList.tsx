"use client";
import { useEffect, useState } from "react";

import Icon from "@/lib/components/ui/Icon/Icon";

import BrainButton, { BrainOrModel } from "./BrainButton/BrainButton";
import styles from "./BrainsList.module.scss";

interface BrainsListProps {
  brains: BrainOrModel[];
  models: BrainOrModel[];
  selectedTab: string;
  brainsPerPage: number;
  newBrain: () => void;
}

const BrainsList = ({
  brains,
  models,
  selectedTab,
  brainsPerPage,
  newBrain,
}: BrainsListProps): JSX.Element => {
  const [currentPage, setCurrentPage] = useState(0);
  const [transitionDirection, setTransitionDirection] = useState("");

  const totalItems =
    selectedTab === "All"
      ? brains.length + models.length
      : selectedTab === "Brains"
      ? brains.length
      : models.length;
  const totalPages = Math.ceil(totalItems / brainsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setTransitionDirection("next");
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setTransitionDirection("prev");
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  useEffect(() => {
    setCurrentPage(0);
  }, [selectedTab]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (document.activeElement) {
        const tagName = document.activeElement.tagName.toLowerCase();
        if (tagName !== "body") {
          return;
        }
      }

      switch (event.key) {
        case "ArrowLeft":
          handlePreviousPage();
          break;
        case "ArrowRight":
          handleNextPage();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handlePreviousPage, handleNextPage]);

  const getDisplayedItems = () => {
    let combinedItems = [];
    if (selectedTab === "All") {
      combinedItems = [...models, ...brains];
    } else if (selectedTab === "Brains") {
      combinedItems = brains;
    } else {
      combinedItems = models;
    }

    return combinedItems.slice(
      currentPage * brainsPerPage,
      (currentPage + 1) * brainsPerPage
    );
  };

  const displayedItems = getDisplayedItems();

  return (
    <div className={styles.brains_list_container}>
      <div
        className={`${styles.chevron} ${
          currentPage === 0 ? styles.disabled : ""
        }`}
        onClick={handlePreviousPage}
      >
        <Icon name="chevronLeft" size="big" color="black" handleHover={true} />
      </div>
      <div
        className={`${styles.brains_list_wrapper} ${
          transitionDirection === "next" ? styles.slide_next : styles.slide_prev
        }`}
      >
        {displayedItems.map((item, index) => (
          <BrainButton key={index} brainOrModel={item} newBrain={newBrain} />
        ))}
      </div>
      <div
        className={`${styles.chevron} ${
          currentPage >= totalPages - 1 ? styles.disabled : ""
        }`}
        onClick={handleNextPage}
      >
        <Icon name="chevronRight" size="big" color="black" handleHover={true} />
      </div>
    </div>
  );
};

export default BrainsList;
