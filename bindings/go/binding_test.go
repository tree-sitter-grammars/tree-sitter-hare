package tree_sitter_hare_test

import (
	"testing"

	tree_sitter "github.com/smacker/go-tree-sitter"
	"github.com/tree-sitter/tree-sitter-hare"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_hare.Language())
	if language == nil {
		t.Errorf("Error loading Hare grammar")
	}
}
